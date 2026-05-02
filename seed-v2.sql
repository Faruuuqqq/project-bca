-- SEED DATA v2.3 - ADDING CUSTOMIZATION TO FRIED CHICKEN

DO $$
DECLARE
  fc_menu_id UUID;
  opt_id UUID;
BEGIN
  -- 1. Cari ID menu Fried Chicken
  SELECT id INTO fc_menu_id FROM menus WHERE name = 'Fried Chicken' LIMIT 1;

  IF fc_menu_id IS NOT NULL THEN
    -- 2. Tambah opsi 'Pilihan Bagian'
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (fc_menu_id, 'Pilihan Bagian', true, 'single', 1)
    RETURNING id INTO opt_id;

    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Dada', 0, 1),
    (opt_id, 'Paha Atas', 0, 2),
    (opt_id, 'Paha Bawah', 0, 3),
    (opt_id, 'Sayap', 0, 4);

    -- 3. Tambah opsi 'Rasa'
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (fc_menu_id, 'Pilihan Rasa', true, 'single', 2)
    RETURNING id INTO opt_id;

    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Original', 0, 1),
    (opt_id, 'Spicy (Pedas)', 0, 2);
    
    RAISE NOTICE 'Customization added to Fried Chicken successfully.';
  ELSE
    RAISE NOTICE 'Menu Fried Chicken not found.';
  END IF;

END $$;
