# Supabase 快速集成指南

## 第一步：获取 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

### 1. 创建 Supabase 项目
1. 访问 https://supabase.com
2. 点击 "Start your project" → 用 GitHub 登录
3. 点击 "New Project"
4. 填写：
   - **Project Name**: `aibattle`
   - **Database Password**: 设置密码（保存好！）
   - **Region**: `Singapore` 或 `N. California`
5. 点击 "Create new project"（等待 1-2 分钟）

### 2. 获取 API 密钥
1. 项目创建后，点击左侧 **"Project Settings"**（齿轮图标）
2. 选择 **"API"** 标签
3. 复制：
   ```
   Project URL: https://xxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIs...
   ```

### 3. 记录你的密钥
```env
VITE_SUPABASE_URL=https://你的-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 第二步：创建数据库表

### 1. 打开 SQL Editor
1. 在 Supabase Dashboard 左侧菜单
2. 点击 **"SQL Editor"**
3. 点击 **"New query"**

### 2. 执行建表脚本
1. 打开项目中的 `supabase/schema.sql` 文件
2. **复制全部内容**
3. 粘贴到 SQL Editor
4. 点击 **"Run"**

### 3. 生成系统 Agents
在 SQL Editor 执行：
```sql
SELECT generate_system_agents(1000);
```

验证：
```sql
SELECT COUNT(*) FROM agents WHERE is_player = false;
-- 应该返回 1000
```

---

## 第三步：配置环境变量

### 1. 创建 .env 文件
```bash
cp .env.example .env
```

### 2. 编辑 .env
```env
VITE_SUPABASE_URL=https://你的-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-key
```

**示例：**
```env
VITE_SUPABASE_URL=https://abc123def456.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbCI6ImFub24iLCJpYXQiOjE2ODU1NTY3MDAsImV4cCI6MjAwMTEzMjcwMH0.xxxxxx
```

---

## 第四步：修改 gameStore（已完成）

### 已修改的功能：

#### 1. `initializeArena` - 从数据库加载系统 Agents
```typescript
initializeArena: async () => {
  // 从 Supabase 获取系统 Agents
  const dbAgents = await AgentService.getSystemAgents(1000);
  
  if (dbAgents.length > 0) {
    // 数据库已有数据，直接使用
    const systemAgents = dbAgents.map(DataTransformers.toFrontendAgent);
    set({ systemAgents });
  } else {
    // 数据库为空，生成并保存
    const systemAgents = generateSystemAgents(1000);
    // 批量保存到数据库...
  }
}
```

#### 2. `connectWallet` - 加载用户的 Agents
```typescript
connectWallet: async (type) => {
  // ... 连接钱包代码 ...
  
  // 从 Supabase 加载用户的 Agents
  const userAgents = await AgentService.getUserAgents(randomAddress);
  set({ myAgents: userAgents.map(DataTransformers.toFrontendAgent) });
}
```

#### 3. `mintAgent` - 保存新 Agent 到数据库
```typescript
mintAgent: async () => {
  // 生成新 Agent
  const newAgent = generateRandomAgent(true, true);
  
  // 保存到 Supabase
  const dbAgent = await AgentService.createAgent({
    ...DataTransformers.toDatabaseAgent(newAgent, userId),
  });
  
  // 创建交易记录
  await TransactionService.createTransaction({
    user_id: userId,
    agent_id: dbAgent.id,
    type: 'mint',
    amount: -mintCost,
  });
}
```

---

## 第五步：启动应用

```bash
npm run dev
```

---

## 文件结构

```
src/
├── lib/
│   └── supabase.ts          # Supabase 客户端配置
├── services/
│   └── database.ts          # 数据库服务层
└── store/
    └── gameStore.ts         # 已修改，支持 Supabase

supabase/
├── schema.sql               # 数据库建表脚本
├── GUIDE.md                 # 完整指南
└── QUICKSTART.md            # 本文件
```

---

## 数据库表

| 表名 | 说明 |
|------|------|
| `users` | 用户信息 |
| `agents` | Agents 数据（1000系统 + 用户） |
| `battles` | 战斗记录 |
| `battle_logs` | 战斗日志 |
| `transactions` | 交易记录 |
| `prediction_markets` | 预测市场 |
| `prediction_bets` | 预测投注 |

---

## 下一步

1. ✅ 完成 Supabase 配置
2. 🔄 添加用户认证（可选）
3. 🔄 实现实时数据同步
4. 🔄 添加数据备份
