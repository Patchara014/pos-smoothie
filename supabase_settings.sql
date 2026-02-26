-- ===== Shop Settings Table =====
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shop_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for shop_settings" ON shop_settings FOR ALL USING (true) WITH CHECK (true);

-- Default settings
INSERT INTO shop_settings (key, value) VALUES
  ('promptpay_number', ''),
  ('shop_name', 'ป้าณาน้ำผลไม้ปั่น'),
  ('shop_phone', '081-234-5678')
ON CONFLICT (key) DO NOTHING;
