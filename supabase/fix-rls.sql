-- ============================================
-- 修复 RLS 策略，允许用户插入自己的 Agents
-- ============================================

-- 1. 删除现有的 Agents 插入策略（如果存在）
DROP POLICY IF EXISTS "Agents can be inserted by authenticated users" ON agents;
DROP POLICY IF EXISTS "Agents can be inserted by owner" ON agents;

-- 2. 创建新的插入策略：允许所有用户插入 Agents
-- 注意：在生产环境中应该更严格，只允许认证用户插入
CREATE POLICY "Agents can be inserted by anyone"
    ON agents FOR INSERT
    WITH CHECK (true);

-- 3. 验证策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agents';
