-- ============================================
-- 更新 Agents：HP = Balance
-- 规则：余额 MON 就是 HP
-- ============================================

-- 1. 更新所有系统 Agents 的 HP = Balance
UPDATE agents 
SET 
    hp = balance,
    max_hp = 10000,
    updated_at = NOW()
WHERE is_player = false;

-- 2. 验证更新结果
SELECT 
    COUNT(*) as total_agents,
    COUNT(CASE WHEN hp = balance THEN 1 END) as hp_equals_balance,
    COUNT(CASE WHEN hp != balance THEN 1 END) as hp_not_equals_balance
FROM agents 
WHERE is_player = false;

-- 3. 显示示例数据
SELECT 
    name,
    balance,
    hp,
    max_hp,
    CASE WHEN hp = balance THEN '✅' ELSE '❌' END as status
FROM agents 
WHERE is_player = false
LIMIT 10;
