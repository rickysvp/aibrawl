-- ============================================
-- AI Brawl 完整数据库初始化脚本
-- ============================================

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar TEXT,
  twitter_id TEXT,
  balance NUMERIC DEFAULT 10000 NOT NULL,
  locked_balance NUMERIC DEFAULT 0 NOT NULL,
  total_minted INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);

-- 2. Agents表
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  style TEXT NOT NULL,
  color TEXT NOT NULL,
  accessories TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  balance NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'idle' NOT NULL, -- idle, in_arena, fighting, eliminated
  total_battles INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  is_player BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_is_player ON agents(is_player);

-- 3. 战斗记录表
CREATE TABLE IF NOT EXISTS battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  participants TEXT[] NOT NULL,
  winner_id TEXT,
  prize_pool NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_battles_round_number ON battles(round_number);

-- 4. 战斗日志表
CREATE TABLE IF NOT EXISTS battle_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID REFERENCES battles(id),
  attacker_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  damage NUMERIC NOT NULL,
  attacker_balance_after NUMERIC,
  target_balance_after NUMERIC,
  is_elimination BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_battle_logs_battle_id ON battle_logs(battle_id);

-- 5. 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT,
  type TEXT NOT NULL, -- mint, battle_win, battle_loss, deposit, withdraw, swap, stake, unstake
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 6. 流动性质押表
CREATE TABLE IF NOT EXISTS liquidity_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  staked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  unlock_time TIMESTAMPTZ NOT NULL,
  last_claim_time TIMESTAMPTZ NOT NULL,
  total_fee_earnings NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL, -- active, unlocked
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_liquidity_stakes_user_address ON liquidity_stakes(user_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_stakes_status ON liquidity_stakes(status);

-- 7. 流动性池全局状态表
CREATE TABLE IF NOT EXISTS liquidity_pool (
  id BIGINT PRIMARY KEY DEFAULT 1,
  total_staked NUMERIC DEFAULT 0 NOT NULL,
  total_rewards NUMERIC DEFAULT 0 NOT NULL,
  apr NUMERIC DEFAULT 25 NOT NULL,
  staker_count INTEGER DEFAULT 0 NOT NULL,
  fee_revenue_pool NUMERIC DEFAULT 0 NOT NULL,
  total_fee_distributed NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 插入初始记录
INSERT INTO liquidity_pool (id, total_staked, total_rewards, apr, staker_count, fee_revenue_pool, total_fee_distributed)
VALUES (1, 0, 0, 25, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 8. 轮次统计表
CREATE TABLE IF NOT EXISTS round_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number BIGINT NOT NULL,
  agent_count INTEGER NOT NULL,
  total_value_locked NUMERIC NOT NULL,
  prize_pool NUMERIC NOT NULL,
  winner_id TEXT,
  winner_profit NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_round_stats_round_number ON round_stats(round_number);

-- 9. 平台收入记录表
CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- battle_fee, other
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 启用行级安全策略 (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON agents;
DROP POLICY IF EXISTS "Allow all" ON battles;
DROP POLICY IF EXISTS "Allow all" ON battle_logs;
DROP POLICY IF EXISTS "Allow all" ON transactions;
DROP POLICY IF EXISTS "Allow all" ON liquidity_stakes;
DROP POLICY IF EXISTS "Allow all" ON liquidity_pool;
DROP POLICY IF EXISTS "Allow all" ON round_stats;
DROP POLICY IF EXISTS "Allow all" ON platform_revenue;

-- 创建允许所有操作的策略（开发阶段）
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON battles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON battle_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON liquidity_stakes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON liquidity_pool FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON round_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON platform_revenue FOR ALL USING (true) WITH CHECK (true);
