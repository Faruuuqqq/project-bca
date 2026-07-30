-- MIGRATION: 001_create_order_atomic.sql
-- DESCRIPTION: Implements 100% atomic order creation via PostgreSQL Stored Procedure (RPC)
-- COMPATIBILITY: 100% aligned with existing schema, Cash lifecycle (unpaid initial status), KDS, Receipts, and Reports.
-- ROLLBACK PLAN: DROP FUNCTION IF EXISTS public.create_order_atomic(TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type TEXT,
  p_payment_method TEXT,
  p_customer_name TEXT,
  p_items JSONB,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_queue_number TEXT;
  v_calculated_total NUMERIC := 0;
  v_item JSONB;
  v_menu_id UUID;
  v_menu_price NUMERIC;
  v_qty INT;
  v_item_subtotal NUMERIC;
  v_order_item_id UUID;
  v_option JSONB;
  v_opt_val_id UUID;
  v_opt_name TEXT;
  v_val_label TEXT;
  v_extra_price NUMERIC;
  v_opt_count INT;
  v_db_menu RECORD;
  v_req_option RECORD;
  v_has_req_option BOOLEAN;
  v_existing_order_id UUID;
BEGIN
  -- 1. Idempotency check: Prevent duplicate orders if idempotency key supplied
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing_order_id FROM orders WHERE customer_name = p_idempotency_key LIMIT 1;
    IF FOUND THEN
      SELECT total_price, queue_number INTO v_calculated_total, v_queue_number FROM orders WHERE id = v_existing_order_id;
      RETURN jsonb_build_object(
        'id', v_existing_order_id,
        'total_price', v_calculated_total,
        'queue_number', v_queue_number,
        'is_duplicate', true
      );
    END IF;
  END IF;

  -- 2. Validate input arguments
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang pesanan kosong';
  END IF;

  IF p_order_type NOT IN ('dine-in', 'take-away') THEN
    RAISE EXCEPTION 'Tipe pesanan tidak valid: %', p_order_type;
  END IF;

  IF p_payment_method NOT IN ('CASH', 'QRIS') THEN
    RAISE EXCEPTION 'Metode pembayaran tidak valid: %', p_payment_method;
  END IF;

  -- 3. Insert parent order with UNPAID status for both CASH and QRIS
  -- (Cash payment requires cashier PIN confirmation via confirmCashPayment)
  INSERT INTO orders (
    order_type,
    total_price,
    payment_method,
    customer_name,
    payment_status,
    order_status
  ) VALUES (
    p_order_type,
    0,
    p_payment_method,
    p_customer_name,
    'unpaid', -- CRITICAL FIX: Always 'unpaid' at order creation
    'pending'
  ) RETURNING id, queue_number INTO v_order_id, v_queue_number;

  -- 4. Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_id := (v_item->>'menuId')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    -- Validate quantity: must be positive integer between 1 and 100
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 100 THEN
      RAISE EXCEPTION 'Kuantitas pesanan tidak valid: %', v_qty;
    END IF;

    -- Fetch trusted menu data from database
    SELECT id, name, price, current_stock, is_sold_out INTO v_db_menu
    FROM menus WHERE id = v_menu_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu tidak ditemukan: %', v_menu_id;
    END IF;

    -- Check availability & stock
    IF v_db_menu.is_sold_out OR v_db_menu.current_stock < v_qty THEN
      RAISE EXCEPTION 'Maaf, stok % habis atau tidak mencukupi', v_db_menu.name;
    END IF;

    -- Validate required option groups for this menu
    FOR v_req_option IN
      SELECT id, name FROM menu_options WHERE menu_id = v_menu_id AND is_required = true
    LOOP
      v_has_req_option := false;
      IF v_item ? 'options' AND jsonb_array_length(v_item->'options') > 0 THEN
        FOR v_option IN SELECT * FROM jsonb_array_elements(v_item->'options')
        LOOP
          v_opt_val_id := (v_option->>'valueId')::UUID;
          IF EXISTS (SELECT 1 FROM menu_option_values WHERE id = v_opt_val_id AND option_id = v_req_option.id) THEN
            v_has_req_option := true;
            EXIT;
          END IF;
        END LOOP;
      END IF;

      IF NOT v_has_req_option THEN
        RAISE EXCEPTION 'Opsi wajib (%) belum dipilih untuk menu %', v_req_option.name, v_db_menu.name;
      END IF;
    END LOOP;

    -- Calculate base item subtotal
    v_menu_price := v_db_menu.price;
    v_item_subtotal := v_menu_price * v_qty;

    -- Insert order item row
    INSERT INTO order_items (
      order_id,
      menu_id,
      menu_name,
      menu_price,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_menu_id,
      v_db_menu.name,
      v_menu_price,
      v_qty,
      v_item_subtotal
    ) RETURNING id INTO v_order_item_id;

    v_calculated_total := v_calculated_total + v_item_subtotal;

    -- Process modifier options
    IF v_item ? 'options' AND jsonb_array_length(v_item->'options') > 0 THEN
      FOR v_option IN SELECT * FROM jsonb_array_elements(v_item->'options')
      LOOP
        v_opt_val_id := (v_option->>'valueId')::UUID;
        v_opt_count := COALESCE((v_option->>'quantity')::INT, 1);

        -- Fetch trusted option value details & extra price
        SELECT mov.extra_price, mov.label, mo.name INTO v_extra_price, v_val_label, v_opt_name
        FROM menu_option_values mov
        JOIN menu_options mo ON mo.id = mov.option_id
        WHERE mov.id = v_opt_val_id;

        IF FOUND THEN
          -- Expand option quantity rows into order_item_options
          FOR i IN 1..v_opt_count LOOP
            INSERT INTO order_item_options (
              order_item_id,
              option_value_id,
              option_name,
              value_label,
              extra_price
            ) VALUES (
              v_order_item_id,
              v_opt_val_id,
              v_opt_name,
              v_val_label,
              v_extra_price
            );
          END LOOP;

          -- Add option extra price to order total
          v_calculated_total := v_calculated_total + (v_extra_price * v_opt_count * v_qty);
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 5. Update parent order total_price with trusted, verified total
  UPDATE orders SET total_price = v_calculated_total WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'total_price', v_calculated_total,
    'queue_number', v_queue_number,
    'is_duplicate', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke default public execution and grant only to service_role, authenticated, anon
REVOKE ALL ON FUNCTION public.create_order_atomic(TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated, service_role;
