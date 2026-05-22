-- SEED DATA UNTUK AYAM KALINTANG

-- 1. KATEGORI
INSERT INTO categories (name, sort_order) VALUES 
('Ayam Goreng', 1),
('Ayam Bakar', 2),
('Paket Hemat', 3),
('Minuman', 4),
('Tambahan', 5);

-- 2. MENU
-- Ambil ID kategori terlebih dahulu
DO $$
DECLARE
  cat_ayam_goreng UUID;
  cat_minuman UUID;
  menu_id UUID;
  option_id UUID;
BEGIN
  SELECT id INTO cat_ayam_goreng FROM categories WHERE name = 'Ayam Goreng';
  SELECT id INTO cat_minuman FROM categories WHERE name = 'Minuman';

  -- Menu 1: Ayam Goreng Dada
  INSERT INTO menus (category_id, name, description, price, image_url)
  VALUES (cat_ayam_goreng, 'Ayam Goreng Dada', 'Ayam goreng rempah khas Kalintang bagian dada yang empuk.', 22000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400')
  RETURNING id INTO menu_id;

  -- Opsi untuk Menu 1: Level Pedas
  INSERT INTO menu_options (menu_id, name, is_required, selection_type)
  VALUES (menu_id, 'Level Pedas', true, 'single')
  RETURNING id INTO option_id;

  INSERT INTO menu_option_values (option_id, label, extra_price) VALUES
  (option_id, 'Original', 0),
  (option_id, 'Pedas Sedang', 0),
  (option_id, 'Sangat Pedas', 2000);

  -- Menu 2: Es Teh Manis
  INSERT INTO menus (category_id, name, description, price, image_url)
  VALUES (cat_minuman, 'Es Teh Manis', 'Teh manis segar dengan es batu kristal.', 5000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400')
  RETURNING id INTO menu_id;

  INSERT INTO menu_options (menu_id, name, is_required, selection_type)
  VALUES (menu_id, 'Ukuran', true, 'single')
  RETURNING id INTO option_id;

  INSERT INTO menu_option_values (option_id, label, extra_price) VALUES
  (option_id, 'Reguler', 0),
  (option_id, 'Jumbo', 3000);

END $$;
