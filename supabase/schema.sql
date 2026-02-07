-- ============================================
-- AIBattle Supabase 数据库 Schema
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE,
    twitter_id TEXT UNIQUE,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE,
    username TEXT,
    avatar TEXT,
    balance DECIMAL(20, 2) DEFAULT 0,
    total_profit DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_twitter ON users(twitter_id);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);

-- ============================================
-- 2. Agents 表
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nft_id INTEGER NOT NULL,
    color TEXT NOT NULL,
    image TEXT,
    
    -- 基础属性 (11-99)
    attack INTEGER DEFAULT 11,
    defense INTEGER DEFAULT 11,
    speed INTEGER DEFAULT 11,
    crit_rate INTEGER DEFAULT 11,
    crit_damage INTEGER DEFAULT 11,
    evasion INTEGER DEFAULT 11,
    accuracy INTEGER DEFAULT 11,
    luck INTEGER DEFAULT 11,
    
    -- 战斗属性
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    
    -- 经济
    balance DECIMAL(20, 2) DEFAULT 0,
    
    -- 统计
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    total_battles INTEGER DEFAULT 0,
    win_rate INTEGER DEFAULT 0,
    total_earnings DECIMAL(20, 2) DEFAULT 0,
    total_losses DECIMAL(20, 2) DEFAULT 0,
    net_profit DECIMAL(20, 2) DEFAULT 0,
    avg_damage_dealt DECIMAL(10, 2) DEFAULT 0,
    avg_damage_taken DECIMAL(10, 2) DEFAULT 0,
    max_kill_streak INTEGER DEFAULT 0,
    current_kill_streak INTEGER DEFAULT 0,
    tournament_wins INTEGER DEFAULT 0,
    tournament_top3 INTEGER DEFAULT 0,
    
    -- 状态
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'in_arena', 'fighting', 'dead')),
    is_player BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_is_player ON agents(is_player);
CREATE INDEX IF NOT EXISTS idx_agents_nft_id ON agents(nft_id);

-- ============================================
-- 3. 战斗记录表 (battles)
-- ============================================
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL,
    participants UUID[] DEFAULT '{}',
    winner_id UUID REFERENCES agents(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_prize DECIMAL(20, 2) DEFAULT 0,
    is_tournament BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_battles_round ON battles(round_number);
CREATE INDEX IF NOT EXISTS idx_battles_winner ON battles(winner_id);
CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at DESC);

-- ============================================
-- 4. 战斗日志表 (battle_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS battle_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    opponent_id UUID REFERENCES agents(id),
    action_type TEXT CHECK (action_type IN ('attack', 'kill', 'round_start', 'round_end', 'join', 'leave')),
    damage DECIMAL(10, 2),
    profit DECIMAL(20, 2),
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_battle_logs_battle ON battle_logs(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_agent ON battle_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_battle_logs_timestamp ON battle_logs(timestamp DESC);

-- ============================================
-- 5. 交易记录表 (transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('mint', 'deposit', 'withdraw', 'battle_reward', 'battle_loss', 'prediction_bet', 'prediction_win')),
    amount DECIMAL(20, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- 6. 预测市场表 (prediction_markets)
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id TEXT,
    market_type TEXT CHECK (market_type IN ('semifinal', 'final', 'match')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled')),
    total_pool DECIMAL(20, 2) DEFAULT 0,
    winner_id UUID REFERENCES agents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prediction_markets_tournament ON prediction_markets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_status ON prediction_markets(status);

-- ============================================
-- 7. 预测投注表 (prediction_bets)
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES prediction_markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    amount DECIMAL(20, 2) NOT NULL,
    odds DECIMAL(10, 2) DEFAULT 0,
    is_settled BOOLEAN DEFAULT false,
    profit DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prediction_bets_market ON prediction_bets(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_user ON prediction_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_agent ON prediction_bets(agent_id);

-- ============================================
-- 8. 自动更新 updated_at 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 agents 表添加触发器
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 启用 Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. 创建基础 RLS 策略
-- ============================================

-- Users: 用户可以读取所有用户，但只能更新自己
DROP POLICY IF EXISTS "Users can read all users" ON users;
CREATE POLICY "Users can read all users"
    ON users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Agents: 所有人可以读取，但只有所有者可以修改
DROP POLICY IF EXISTS "Agents are viewable by everyone" ON agents;
CREATE POLICY "Agents are viewable by everyone"
    ON agents FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Agents can be updated by owner" ON agents;
CREATE POLICY "Agents can be updated by owner"
    ON agents FOR ALL
    USING (auth.uid() = owner_id);

-- Battles: 所有人可以读取
DROP POLICY IF EXISTS "Battles are viewable by everyone" ON battles;
CREATE POLICY "Battles are viewable by everyone"
    ON battles FOR SELECT
    USING (true);

-- Battle Logs: 所有人可以读取
DROP POLICY IF EXISTS "Battle logs are viewable by everyone" ON battle_logs;
CREATE POLICY "Battle logs are viewable by everyone"
    ON battle_logs FOR SELECT
    USING (true);

-- Transactions: 用户只能看到自己的交易
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Prediction Markets: 所有人可以读取
DROP POLICY IF EXISTS "Prediction markets are viewable by everyone" ON prediction_markets;
CREATE POLICY "Prediction markets are viewable by everyone"
    ON prediction_markets FOR SELECT
    USING (true);

-- Prediction Bets: 用户只能看到自己的投注
DROP POLICY IF EXISTS "Users can view own bets" ON prediction_bets;
CREATE POLICY "Users can view own bets"
    ON prediction_bets FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 11. 插入初始系统 Agents (1000个)
-- ============================================

-- 创建生成系统 Agents 的函数
CREATE OR REPLACE FUNCTION generate_system_agents(count INTEGER DEFAULT 1000)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    prefixes TEXT[] := ARRAY['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
    suffixes TEXT[] := ARRAY['X', 'Prime', 'Max', 'Pro', 'Ultra', 'Neo', 'Cyber', 'Quantum', 'Mega', 'Hyper'];
    colors TEXT[] := ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'];
    prefix TEXT;
    suffix TEXT;
    agent_name TEXT;
    agent_color TEXT;
BEGIN
    FOR i IN 1..count LOOP
        prefix := prefixes[1 + (i % array_length(prefixes, 1))];
        suffix := suffixes[1 + ((i / 10) % array_length(suffixes, 1))];
        agent_name := prefix || '-' || suffix || '-' || i;
        agent_color := colors[1 + (i % array_length(colors, 1))];
        
        INSERT INTO agents (
            name, nft_id, color, image,
            attack, defense, speed, crit_rate, crit_damage, evasion, accuracy, luck,
            hp, max_hp, balance,
            status, is_player
        ) VALUES (
            agent_name, i, agent_color, NULL,
            11 + (i % 89), 11 + ((i * 2) % 89), 11 + ((i * 3) % 89),
            11 + ((i * 4) % 89), 11 + ((i * 5) % 89), 11 + ((i * 6) % 89),
            11 + ((i * 7) % 89), 11 + ((i * 8) % 89),
            100, 100, 10000,
            'in_arena', false
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 执行生成（如果需要）
-- SELECT generate_system_agents(1000);

-- ============================================
-- 完成
-- ============================================
