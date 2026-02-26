-- 1. 创建 liquidity_stakes 表
create table if not exists liquidity_stakes (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  user_address text not null,
  amount numeric not null,
  staked_at timestamptz default now() not null,
  unlock_time timestamptz not null,
  last_claim_time timestamptz not null,
  total_fee_earnings numeric default 0 not null,
  status text default 'active' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 创建索引
create index if not exists idx_liquidity_stakes_user_address on liquidity_stakes(user_address);
create index if not exists idx_liquidity_stakes_status on liquidity_stakes(status);

-- 启用RLS
alter table liquidity_stakes enable row level security;

-- 删除已存在的策略（如果有）
drop policy if exists "Allow all" on liquidity_stakes;

-- 创建策略
create policy "Allow all" on liquidity_stakes for all using (true) with check (true);

-- 2. 创建 liquidity_pool 表
create table if not exists liquidity_pool (
  id bigint primary key default 1,
  total_staked numeric default 0 not null,
  total_rewards numeric default 0 not null,
  apr numeric default 25 not null,
  staker_count bigint default 0 not null,
  fee_revenue_pool numeric default 0 not null,
  total_fee_distributed numeric default 0 not null,
  updated_at timestamptz default now() not null
);

-- 插入初始记录
insert into liquidity_pool (id, total_staked, total_rewards, apr, staker_count, fee_revenue_pool, total_fee_distributed)
values (1, 500000, 25000, 25, 128, 0, 0)
on conflict (id) do nothing;

-- 启用RLS
alter table liquidity_pool enable row level security;

-- 删除已存在的策略（如果有）
drop policy if exists "Allow all" on liquidity_pool;

-- 创建策略
create policy "Allow all" on liquidity_pool for all using (true) with check (true);

-- 3. 创建 transactions 表 (如果不存在)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  agent_id text,
  type text not null,
  amount numeric not null,
  status text default 'completed' not null,
  tx_hash text,
  created_at timestamptz default now() not null
);

-- 启用RLS
alter table transactions enable row level security;

-- 删除已存在的策略（如果有）
drop policy if exists "Allow all" on transactions;

-- 创建策略
create policy "Allow all" on transactions for all using (true) with check (true);
