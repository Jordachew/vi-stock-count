-- ============================================================
-- VI Stock Count — Initial Schema
-- Victoria's Intimates, Jamaica
-- ============================================================

-- Master item catalog
create table public.master_items (
  id uuid default gen_random_uuid() primary key,
  sku text not null unique,
  description text not null,
  size text,
  color text,
  system_qty integer default 0,
  branch text,
  location text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stock count sessions
create table public.stock_sessions (
  id uuid default gen_random_uuid() primary key,
  session_name text not null,
  branch text not null,
  count_date date not null,
  status text default 'open' check (status in ('open', 'closed', 'reconciled')),
  entered_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Actual physical count entries
create table public.stock_count_actuals (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.stock_sessions(id) on delete cascade,
  sku text not null,
  description text,
  qty_counted integer default 1,
  location text,
  size text,
  color text,
  entered_by text,
  date_of_count date,
  notes text,
  is_new_item boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index on public.master_items (sku);
create index on public.master_items (branch);
create index on public.master_items (is_active);
create index on public.stock_count_actuals (session_id);
create index on public.stock_count_actuals (sku);
create index on public.stock_sessions (status);
create index on public.stock_sessions (branch);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger master_items_updated_at
  before update on public.master_items
  for each row execute function update_updated_at();

create trigger stock_sessions_updated_at
  before update on public.stock_sessions
  for each row execute function update_updated_at();

create trigger stock_count_actuals_updated_at
  before update on public.stock_count_actuals
  for each row execute function update_updated_at();

-- RLS
alter table public.master_items enable row level security;
alter table public.stock_sessions enable row level security;
alter table public.stock_count_actuals enable row level security;

-- Open access policies (MVP — no auth required)
create policy "Public read master_items" on public.master_items for select using (true);
create policy "Public write master_items" on public.master_items for all using (true);
create policy "Public read sessions" on public.stock_sessions for select using (true);
create policy "Public write sessions" on public.stock_sessions for all using (true);
create policy "Public read actuals" on public.stock_count_actuals for select using (true);
create policy "Public write actuals" on public.stock_count_actuals for all using (true);
