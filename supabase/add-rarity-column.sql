-- ============================================-- 添加 rarity 字段到 agents 表-- ============================================

-- 1. 添加 rarity 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'rarity'
    ) THEN
        ALTER TABLE agents ADD COLUMN rarity VARCHAR(20) DEFAULT 'common';
        RAISE NOTICE 'Added rarity column to agents table';
    ELSE
        RAISE NOTICE 'rarity column already exists';
    END IF;
END $$;

-- 2. 更新现有数据的稀有度（根据属性总和计算）
UPDATE agents 
SET rarity = CASE 
    WHEN (attack + defense + speed + crit_rate + crit_damage + evasion + accuracy + luck) >= 300 THEN 'mythic'
    WHEN (attack + defense + speed + crit_rate + crit_damage + evasion + accuracy + luck) >= 250 THEN 'legendary'
    WHEN (attack + defense + speed + crit_rate + crit_damage + evasion + accuracy + luck) >= 200 THEN 'epic'
    WHEN (attack + defense + speed + crit_rate + crit_damage + evasion + accuracy + luck) >= 150 THEN 'rare'
    ELSE 'common'
END
WHERE rarity IS NULL;

-- 3. 验证更新结果
SELECT 
    rarity,
    COUNT(*) as count,
    AVG(attack + defense + speed + crit_rate + crit_damage + evasion + accuracy + luck) as avg_stats
FROM agents 
GROUP BY rarity
ORDER BY count DESC;
