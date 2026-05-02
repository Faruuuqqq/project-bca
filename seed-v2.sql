-- SEED DATA v2.2 - ADDING MENU CUSTOMIZATIONS

DO $$
DECLARE
  menu_rec RECORD;
  opt_id UUID;
BEGIN
  -- 1. ADD 'Pilihan Bagian Ayam' TO ALL CHICKEN MENUS (Dada, Paha, Penyet, Geprek, etc.)
  FOR menu_rec IN 
    SELECT id, name FROM menus 
    WHERE name ILIKE '%Ayam%' AND name NOT ILIKE '%Utuh%' -- Exclude whole chicken
  LOOP
    -- Add the option group
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (menu_rec.id, 'Pilihan Bagian', true, 'single', 1)
    RETURNING id INTO opt_id;

    -- Add the values
    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Dada', 0, 1),
    (opt_id, 'Paha Atas', 0, 2),
    (opt_id, 'Paha Bawah', 0, 3),
    (opt_id, 'Sayap', 0, 4);

    -- Add 'Level Sambal' group
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (menu_rec.id, 'Level Sambal', true, 'single', 2)
    RETURNING id INTO opt_id;

    -- Add sambal levels
    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Tidak Pedas', 0, 1),
    (opt_id, 'Normal', 0, 2),
    (opt_id, 'Extra Sambal', 2000, 3);
  END LOOP;

  -- 2. ADD 'Kematangan' TO SATE (Optional example)
  -- FOR menu_rec IN SELECT id FROM menus WHERE category_id = (SELECT id FROM categories WHERE name = 'Serba Sate')
  -- LOOP ... END LOOP;

END $$;
