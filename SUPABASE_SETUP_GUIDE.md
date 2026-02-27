# Supabase 数据库设置指南

## 问题原因
刷新后数据被重置是因为 Supabase 数据库表尚未创建。

## 解决步骤

### 1. 登录 Supabase 控制台
- 访问 https://app.supabase.com
- 进入项目 `olyhvjdbucoafjqcagwm`

### 2. 打开 SQL Editor
- 点击左侧菜单 **SQL Editor**
- 点击 **New query**

### 3. 执行以下 SQL

```sql
-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar TEXT,
  balance NUMERIC DEFAULT 10000 NOT NULL,
  locked_balance NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Agents表
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  style TEXT NOT NULL,
  color TEXT NOT NULL,
  balance NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'idle' NOT NULL,
  is_player BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. 流动性质押表
CREATE TABLE IF NOT EXISTS liquidity_stakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  staked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  unlock_time TIMESTAMPTZ NOT NULL,
  last_claim_time TIMESTAMPTZ NOT NULL,
  total_fee_earnings NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. 流动性池表
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

INSERT INTO liquidity_pool (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. 轮次统计表
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

-- 启用RLS并添加策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON agents;
DROP POLICY IF EXISTS "Allow all" ON liquidity_stakes;
DROP POLICY IF EXISTS "Allow all" ON liquidity_pool;
DROP POLICY IF EXISTS "Allow all" ON round_stats;

CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON liquidity_stakes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON liquidity_pool FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON round_stats FOR ALL USING (true) WITH CHECK (true);
```

### 4. 执行 SQL
- 粘贴上面的 SQL 到编辑器
- 点击 **Run** 按钮

### 5. 验证表是否创建成功
```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 完整 SQL 文件
如需完整表结构，请执行 `supabase-setup-complete.sql` 文件中的所有 SQL。
