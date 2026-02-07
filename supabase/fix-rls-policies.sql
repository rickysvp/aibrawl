-- ============================================-- 修复 RLS 策略，允许匿名用户创建和读取-- ============================================

-- 1. 禁用所有表的 RLS（快速解决方案）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE battles DISABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs DISABLE ROW LEVEL SECURITY;

-- 或者使用更细粒度的控制：
-- 重新启用 RLS 但允许所有操作
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on agents" ON agents;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all operations on battles" ON battles;
DROP POLICY IF EXISTS "Allow all operations on battle_logs" ON battle_logs;

-- 创建允许所有操作的策略
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on battles" ON battles FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on battle_logs" ON battle_logs FOR ALL USING (true) WITH CHECK (true);

-- 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'agents', 'transactions', 'battles', 'battle_logs');
