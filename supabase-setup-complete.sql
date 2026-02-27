-- ============================================
-- AI Brawl 完整数据库初始化脚本
-- ============================================

-- 删除已存在的表（重新创建）
DROP TABLE IF EXISTS battle_logs CASCADE;
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS liquidity_stakes CASCADE;
DROP TABLE IF EXISTS liquidity_pool CASCADE;
DROP TABLE IF EXISTS round_stats CASCADE;
DROP TABLE IF EXISTS platform_revenue CASCADE;

-- 1. 用户表 (users)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE,
  twitter_id TEXT UNIQUE,
  google_id TEXT UNIQUE,
  email TEXT,
  username TEXT,
  avatar TEXT,
  balance NUMERIC DEFAULT 10000 NOT NULL,
  locked_balance NUMERIC DEFAULT 0 NOT NULL,
  total_minted INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_twitter_id ON users(twitter_id);

-- 2. Agents表（包含所有字段）
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nft_id INTEGER DEFAULT 0,
  color TEXT NOT NULL,
  image TEXT,
  -- 属性
  attack NUMERIC DEFAULT 50,
  defense NUMERIC DEFAULT 50,
  speed NUMERIC DEFAULT 50,
  crit_rate NUMERIC DEFAULT 10,
  crit_damage NUMERIC DEFAULT 150,
  evasion NUMERIC DEFAULT 10,
  accuracy NUMERIC DEFAULT 90,
  luck NUMERIC DEFAULT 50,
  -- 战斗属性
  hp NUMERIC DEFAULT 100,
  max_hp NUMERIC DEFAULT 100,
  -- 经济
  balance NUMERIC DEFAULT 0 NOT NULL,
  -- 统计
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  total_losses NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  avg_damage_dealt NUMERIC DEFAULT 0,
  avg_damage_taken NUMERIC DEFAULT 0,
  max_kill_streak INTEGER DEFAULT 0,
  current_kill_streak INTEGER DEFAULT 0,
  tournament_wins INTEGER DEFAULT 0,
  tournament_top3 INTEGER DEFAULT 0,
  -- 状态
  status TEXT DEFAULT 'idle' NOT NULL,
  is_player BOOLEAN DEFAULT TRUE,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_agents_owner_id ON agents(owner_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_is_player ON agents(is_player);

-- 3. 战斗记录表
CREATE TABLE battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  participants TEXT[] NOT NULL,
  winner_id TEXT,
  prize_pool NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_battles_round_number ON battles(round_number);

-- 4. 战斗日志表
CREATE TABLE battle_logs (
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

CREATE INDEX idx_battle_logs_battle_id ON battle_logs(battle_id);

-- 5. 交易记录表
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);

-- 6. 流动性质押表
CREATE TABLE liquidity_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  staked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  unlock_time TIMESTAMPTZ NOT NULL,
  last_claim_time TIMESTAMPTZ NOT NULL,
  total_fee_earnings NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_liquidity_stakes_user_address ON liquidity_stakes(user_address);
CREATE INDEX idx_liquidity_stakes_status ON liquidity_stakes(status);

-- 7. 流动性池全局状态表
CREATE TABLE liquidity_pool (
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
VALUES (1, 0, 0, 25, 0, 0, 0);

-- 8. 轮次统计表
CREATE TABLE round_stats (
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

CREATE INDEX idx_round_stats_round_number ON round_stats(round_number);

-- 9. 平台收入记录表
CREATE TABLE platform_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
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
