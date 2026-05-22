import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tH_VWp6akmRVi5M3Ez2rFQ.supabase.co' // Inferring from publishable key prefix if possible, but usually it's different.
// Wait, the keys provided look like 'sb_publishable_...' which is unusual for standard Supabase.
// Usually it's a URL like https://xyz.supabase.co and an anon/service key.
// I will assume the user provided the Project ID or similar.
// Actually, I'll use a script to try and execute the SQL.

async function runSql() {
  const supabase = createClient(
    'https://tH_VWp6akmRVi5M3Ez2rFQ.supabase.co', 
    'sb_secret_t4gIRGPqmPcuLtfCC_i4IA_axofu2jq'
  )

  const sql = `
-- STEP 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- Often requires manual activation or specific tier

-- STEP 2: Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Menus
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_sold_out BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Menu options (kelompok kustomisasi)
CREATE TABLE IF NOT EXISTS menu_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  selection_type VARCHAR(10) DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
  sort_order INT DEFAULT 0
);

-- STEP 5: Menu option values
CREATE TABLE IF NOT EXISTS menu_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID REFERENCES menu_options(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0,
  sort_order INT DEFAULT 0
);

-- STEP 6: Daily queue sequences
CREATE TABLE IF NOT EXISTS daily_queue_sequences (
  queue_date DATE PRIMARY KEY,
  last_sequence INT NOT NULL DEFAULT 0
);

-- STEP 7: Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_number VARCHAR(4) NOT NULL,
  queue_date DATE NOT NULL,
  customer_name VARCHAR(50),
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine-in', 'take-away')),
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('QRIS', 'CASH')),
  payment_status VARCHAR(10) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'void')),
  order_status VARCHAR(15) DEFAULT 'pending' CHECK (order_status IN ('pending', 'cooking', 'ready', 'completed', 'void')),
  midtrans_order_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 8: Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id),
  menu_name VARCHAR(100) NOT NULL,
  menu_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 9: Order item options
CREATE TABLE IF NOT EXISTS order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  option_value_id UUID REFERENCES menu_option_values(id),
  option_name VARCHAR(50) NOT NULL,
  value_label VARCHAR(50) NOT NULL,
  extra_price DECIMAL(10,2) NOT NULL DEFAULT 0
);
  `

  console.log('Executing SQL...')
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error('Error executing SQL:', error)
    console.log('Note: You might need to create the exec_sql function manually in Supabase SQL Editor first, or I can try another way.')
  } else {
    console.log('SQL executed successfully!')
  }
}

// runSql()
