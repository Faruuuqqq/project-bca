-- SEED DATA v2.3 - UPDATED PRICES & CUSTOMIZATIONS

-- 1. BERSIHKAN DATA LAMA
TRUNCATE categories, menus, inventory_movements, order_items, orders CASCADE;

-- 2. KATEGORI
INSERT INTO categories (name, sort_order) VALUES 
('Paket Hemat', 1),
('A la Carte', 2),
('Serba Sate', 3),
('Tambahan', 4);

-- 3. MENU DATA
DO $$
DECLARE
  cat_paket UUID;
  cat_alacarte UUID;
  cat_sate UUID;
  cat_tambahan UUID;
  menu_id UUID;
  opt_id UUID;
BEGIN
  SELECT id INTO cat_paket FROM categories WHERE name = 'Paket Hemat';
  SELECT id INTO cat_alacarte FROM categories WHERE name = 'A la Carte';
  SELECT id INTO cat_sate FROM categories WHERE name = 'Serba Sate';
  SELECT id INTO cat_tambahan FROM categories WHERE name = 'Tambahan';

  -- KATEGORI: PAKET HEMAT
  INSERT INTO menus (category_id, name, description, price, image_url, current_stock, sort_order) VALUES
  (cat_paket, 'Paket Nasi Ayam Geprek', 'Nasi Putih + Tahu + Tempe + Sambal', 16000, 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600', 100, 1),
  (cat_paket, 'Paket Nasi Ayam Serundeng', 'Nasi Putih + Tahu + Tempe + Sambal', 16000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600', 100, 2),
  (cat_paket, 'Paket Nasi Ayam Penyet', 'Nasi Putih + Tahu + Tempe + Sambal', 16000, 'https://images.unsplash.com/photo-1625938146369-adc83368bca2?auto=format&fit=crop&w=600', 100, 3);

  -- KATEGORI: A LA CARTE
  -- Ayam Utuh with Size Options
  INSERT INTO menus (category_id, name, description, price, image_url, current_stock, sort_order)
  VALUES (cat_alacarte, 'Ayam Goreng Utuh', 'Ayam goreng utuh satu ekor', 35000, 'https://images.unsplash.com/photo-1594759842811-999a12691475?auto=format&fit=crop&w=600', 50, 1)
  RETURNING id INTO menu_id;

  INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
  VALUES (menu_id, 'Pilih Ukuran', true, 'single', 1)
  RETURNING id INTO opt_id;

  INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
  (opt_id, 'Kecil', 0, 1),
  (opt_id, 'Sedang', 5000, 2),
  (opt_id, 'Besar', 10000, 3);

  INSERT INTO menus (category_id, name, description, price, image_url, current_stock, sort_order) VALUES
  (cat_alacarte, 'Ayam Serundeng', 'Potongan ayam dengan bumbu serundeng melimpah', 10000, 'https://images.unsplash.com/photo-1626082895617-2c6de3476af7?auto=format&fit=crop&w=600', 100, 2),
  (cat_alacarte, 'Ayam Penyet', 'Ayam goreng dengan sambal penyet pedas mantap', 10000, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600', 100, 3),
  (cat_alacarte, 'Ayam Geprek', 'Ayam goreng tepung krispi digeprek sambal bawang', 10000, 'https://images.unsplash.com/photo-1562607311-477467657989?auto=format&fit=crop&w=600', 100, 4),
  (cat_alacarte, 'Fried Chicken', 'Ayam goreng krispi gaya western', 8000, 'https://images.unsplash.com/photo-1626645738196-c2a7c8d08f58?auto=format&fit=crop&w=600', 100, 5);

  -- KATEGORI: SERBA SATE
  INSERT INTO menus (category_id, name, description, price, image_url, current_stock, sort_order) VALUES
  (cat_sate, 'Sate Ati Ampela', 'Sate ati ampela ayam bumbu kuning', 5000, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400', 50, 1),
  (cat_sate, 'Sate Kulit', 'Sate kulit ayam goreng garing', 3000, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400', 100, 2),
  (cat_sate, 'Sate Kepala', 'Sate kepala ayam ungkep', 3000, 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=400', 50, 3),
  (cat_sate, 'Sate Telur Puyuh', 'Sate telur puyuh bumbu bacem', 5000, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400', 50, 4),
  (cat_sate, 'Sate Usus', 'Sate usus ayam gurih', 3000, 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400', 100, 5);

  -- KATEGORI: TAMBAHAN
  INSERT INTO menus (category_id, name, description, price, image_url, current_stock, sort_order) VALUES
  (cat_tambahan, 'Nasi Putih', 'Nasi putih pulen hangat', 5000, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400', 200, 1),
  (cat_tambahan, 'Tahu Goreng', 'Tahu goreng isi 2 pcs', 5000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400', 100, 2),
  (cat_tambahan, 'Tempe Goreng', 'Tempe goreng garing', 1000, 'https://images.unsplash.com/photo-1584263343327-024227917cc5?auto=format&fit=crop&w=400', 100, 3),
  (cat_tambahan, 'Extra Sambal', 'Pilihan: Sambal Bawang / Sambal Terasi', 3000, 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=400', 200, 4),
  (cat_tambahan, 'Pete Goreng', 'Pete goreng segar', 7000, 'https://images.unsplash.com/photo-1621460244111-f1873138379c?auto=format&fit=crop&w=400', 30, 5),
  (cat_tambahan, 'Jukut Goreng', 'Sayuran goreng krispi (Selada Air)', 3000, 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=400', 100, 6);

  -- 4. ADD CUSTOMIZATIONS FOR ALL CHICKEN ITEMS
  FOR menu_id IN 
    SELECT id FROM menus 
    WHERE name ILIKE '%Ayam%' AND name NOT ILIKE '%Utuh%'
  LOOP
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (menu_id, 'Pilihan Bagian', true, 'single', 1)
    RETURNING id INTO opt_id;

    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Dada', 0, 1),
    (opt_id, 'Paha Atas', 0, 2),
    (opt_id, 'Paha Bawah', 0, 3),
    (opt_id, 'Sayap', 0, 4);

    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (menu_id, 'Level Sambal', true, 'single', 2)
    RETURNING id INTO opt_id;

    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Tidak Pedas', 0, 1),
    (opt_id, 'Normal', 0, 2),
    (opt_id, 'Extra Sambal', 2000, 3);
  END LOOP;

  -- 5. SPECIAL CUSTOMIZATION FOR FRIED CHICKEN (RASA)
  SELECT id INTO menu_id FROM menus WHERE name = 'Fried Chicken' LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO menu_options (menu_id, name, is_required, selection_type, sort_order)
    VALUES (menu_id, 'Pilihan Rasa', true, 'single', 3)
    RETURNING id INTO opt_id;

    INSERT INTO menu_option_values (option_id, label, extra_price, sort_order) VALUES
    (opt_id, 'Original', 0, 1),
    (opt_id, 'Spicy (Pedas)', 0, 2);
  END IF;

END $$;
