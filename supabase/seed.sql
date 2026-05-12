-- Seed data for VI Stock Count — testing only
-- Run after migration 001_initial.sql

insert into public.master_items (sku, description, size, color, system_qty, branch, location, is_active) values
  ('BRA-001-36B-BLK', 'Underwire Push-Up Bra', '36B', 'Black', 12, 'Montego Bay', 'Bra Column 1', true),
  ('BRA-001-36B-WHT', 'Underwire Push-Up Bra', '36B', 'White', 8, 'Montego Bay', 'Bra Column 1', true),
  ('BRA-001-38C-BLK', 'Underwire Push-Up Bra', '38C', 'Black', 6, 'Montego Bay', 'Bra Column 2', true),
  ('BRA-002-34B-NUD', 'T-Shirt Bra Seamless', '34B', 'Nude', 15, 'Montego Bay', 'Bra Column 3', true),
  ('BRA-002-36C-NUD', 'T-Shirt Bra Seamless', '36C', 'Nude', 10, 'Montego Bay', 'Bra Column 3', true),
  ('PNT-001-S-BLK', 'High-Cut Bikini Brief', 'S', 'Black', 24, 'Montego Bay', 'Draw 1', true),
  ('PNT-001-M-BLK', 'High-Cut Bikini Brief', 'M', 'Black', 30, 'Montego Bay', 'Draw 1', true),
  ('PNT-001-L-BLK', 'High-Cut Bikini Brief', 'L', 'Black', 20, 'Montego Bay', 'Draw 1', true),
  ('PNT-002-S-RED', 'Lace Thong', 'S', 'Red', 18, 'Montego Bay', 'Draw 2', true),
  ('PNT-002-M-RED', 'Lace Thong', 'M', 'Red', 22, 'Montego Bay', 'Draw 2', true),
  ('SET-001-36B-BLK', 'Matching Bra & Brief Set', '36B', 'Black', 5, 'Montego Bay', 'Rack 1', true),
  ('BRA-003-34C-BLK', 'Sports Bra High Impact', '34C', 'Black', 8, 'Kingston', 'Bra Column 1', true),
  ('BRA-003-36D-BLK', 'Sports Bra High Impact', '36D', 'Black', 6, 'Kingston', 'Bra Column 1', true),
  ('PNT-003-M-WHT', 'Cotton Hipster Brief', 'M', 'White', 35, 'Kingston', 'Draw 1', true),
  ('PNT-003-L-WHT', 'Cotton Hipster Brief', 'L', 'White', 28, 'Kingston', 'Draw 1', true),
  ('STOR-BRA-36B-MIX', 'Assorted Bras 36B', '36B', 'Mixed', 50, 'Off site storage', 'Storage room shelf 1', true),
  ('STOR-PNT-M-MIX', 'Assorted Panties Medium', 'M', 'Mixed', 100, 'Off site storage', 'Storage room shelf 2', true);

-- Sample open session
insert into public.stock_sessions (session_name, branch, count_date, status, entered_by, notes) values
  ('MBJ Count May 2026 — Week 1', 'Montego Bay', '2026-05-12', 'open', 'Andrea', 'First count of the month'),
  ('KGN Count May 2026', 'Kingston', '2026-05-10', 'closed', 'Tamara', 'End of week count');
