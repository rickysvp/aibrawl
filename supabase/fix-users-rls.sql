-- ============================================
-- 修复 Users 表的 RLS 策略
-- ============================================

-- 1. 删除现有的 users 插入策略（如果存在）
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can be created by anyone" ON users;

-- 2. 创建新的插入策略：允许所有用户创建账户
CREATE POLICY "Users can be created by anyone"
    ON users FOR INSERT
    WITH CHECK (true);

-- 3. 验证 users 表的 RLS 策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';
