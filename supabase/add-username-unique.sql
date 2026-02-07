-- ============================================-- 添加用户名唯一约束-- ============================================

-- 1. 添加用户名唯一索引（如果不存在）
DO $$
BEGIN
    -- 检查是否已存在唯一约束
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'users_username_unique'
    ) THEN
        -- 先清理重复的用户名（保留最早创建的）
        WITH ranked_users AS (
            SELECT 
                id,
                username,
                ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at ASC) as rn
            FROM users
            WHERE username IS NOT NULL
        )
        DELETE FROM users 
        WHERE id IN (
            SELECT id FROM ranked_users WHERE rn > 1
        );
        
        -- 创建唯一索引
        CREATE UNIQUE INDEX users_username_unique ON users(username);
        RAISE NOTICE 'Created unique index on username';
    ELSE
        RAISE NOTICE 'Unique index already exists';
    END IF;
END $$;

-- 2. 验证索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'users_username_unique';

-- 3. 查看当前用户数据
SELECT 
    username,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM users 
WHERE username IS NOT NULL
GROUP BY username
ORDER BY count DESC
LIMIT 10;
