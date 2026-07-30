-- MIGRATION: 001_create_order_atomic.sql
-- DESCRIPTION: Implements 100% atomic order creation via PostgreSQL Stored Procedure (RPC)
-- ROLLBACK PLAN: DROP FUNCTION IF EXISTS public.create_order_atomic(TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type TEXT,
  p_payment_method TEXT,
  p_customer_name TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_calculated_total NUMERIC := 0;
  v_item JSONB;
  v_menu_id UUID;
  v_menu_price NUMERIC;
  v_qty INT;
  v_item_subtotal NUMERIC;
  v_order_item_id UUID;
  v_option JSONB;
  v_opt_val_id UUID;
  v_extra_price NUMERIC;
  v_opt_count INT;
  v_db_menu RECORD;
BEGIN
  -- Validate items payload
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  -- 1. Create order parent record with initial 0 total
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
    CASE WHEN p_payment_method = 'CASH' THEN 'paid' ELSE 'unpaid' END,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- 2. Loop over items, fetch official DB price, insert items & options
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_id := (v_item->>'menuId')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than 0';
    END IF;

    -- Fetch trusted price from database (Never trust client-submitted prices)
    SELECT price, name INTO v_db_menu FROM menus WHERE id = v_menu_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item not found in database: %', v_menu_id;
    END IF;

    v_menu_price := v_db_menu.price;
    v_item_subtotal := v_menu_price * v_qty;

    -- Insert order item
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

    -- Insert options if present
    IF v_item ? 'options' AND jsonb_array_length(v_item->'options') > 0 THEN
      FOR v_option IN SELECT * FROM jsonb_array_elements(v_item->'options')
      LOOP
        v_opt_val_id := (v_option->>'valueId')::UUID;
        v_opt_count := COALESCE((v_option->>'quantity')::INT, 1);
        
        SELECT extra_price INTO v_extra_price FROM menu_option_values WHERE id = v_opt_val_id;
        IF NOT FOUND THEN
          v_extra_price := 0;
        END IF;

        -- Expand options into order_item_options
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
            v_option->>'optionName',
            v_option->>'valueLabel',
            v_extra_price
          );
        END LOOP;

        v_calculated_total := v_calculated_total + (v_extra_price * v_opt_count);
      END LOOP;
    END IF;
  END LOOP;

  -- 3. Update parent order total_price with trusted, verified calculated total
  UPDATE orders SET total_price = v_calculated_total WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'total_price', v_calculated_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
