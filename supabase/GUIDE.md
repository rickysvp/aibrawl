# Supabase 集成完整指南

## 目录
1. [创建 Supabase 项目](#1-创建-supabase-项目)
2. [配置数据库](#2-配置数据库)
3. [获取连接信息](#3-获取连接信息)
4. [配置环境变量](#4-配置环境变量)
5. [测试连接](#5-测试连接)
6. [数据迁移](#6-数据迁移)
7. [修改前端代码](#7-修改前端代码)
8. [部署](#8-部署)

---

## 1. 创建 Supabase 项目

### 步骤 1.1: 注册/登录 Supabase
1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录

### 步骤 1.2: 创建新项目
1. 点击 "New Project"
2. 填写项目信息：
   - **Organization**: 选择或创建组织
   - **Project Name**: `aibattle` (或你喜欢的名字)
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择离你最近的区域（如 `Singapore` 或 `N. California`）
3. 点击 "Create new project"
4. 等待项目创建完成（约 1-2 分钟）

---

## 2. 配置数据库

### 步骤 2.1: 打开 SQL Editor
1. 进入项目 Dashboard
2. 左侧菜单点击 "SQL Editor"
3. 点击 "New query"

### 步骤 2.2: 执行建表脚本
1. 打开 `supabase/schema.sql` 文件
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 "Run" 执行

### 步骤 2.3: 生成系统 Agents
执行以下 SQL 生成 1000 个系统 Agents：

```sql
SELECT generate_system_agents(1000);
```

验证是否成功：
```sql
SELECT COUNT(*) FROM agents WHERE is_player = false;
-- 应该返回 1000
```

---

## 3. 获取连接信息

### 步骤 3.1: 获取 API 凭证
1. 左侧菜单点击 "Project Settings"（齿轮图标）
2. 选择 "API" 标签
3. 复制以下信息：
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIs...`

### 步骤 3.2: 保存凭证
将以下信息保存到安全的地方：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. 配置环境变量

### 步骤 4.1: 创建 .env 文件
在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

### 步骤 4.2: 编辑 .env 文件
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **重要**: 
- `.env` 文件已添加到 `.gitignore`，不会被提交
- 不要将真实的密钥提交到 GitHub

---

## 5. 测试连接

### 步骤 5.1: 重启开发服务器
```bash
npm run dev
```

### 步骤 5.2: 测试数据库连接
在浏览器控制台测试：

```javascript
import { supabase } from './src/lib/supabase';

// 测试查询
const testConnection = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('连接失败:', error);
  } else {
    console.log('连接成功!', data);
  }
};

testConnection();
```

---

## 6. 数据迁移

### 步骤 6.1: 迁移现有本地数据（可选）
如果之前有本地数据需要迁移：

```typescript
// 在应用启动时执行一次
const migrateData = async () => {
  const { myAgents, systemAgents } = useGameStore.getState();
  
  // 迁移系统 Agents
  for (const agent of systemAgents) {
    await AgentService.createAgent({
      ...DataTransformers.toDatabaseAgent(agent, 'system'),
      is_player: false,
    });
  }
  
  console.log('数据迁移完成');
};
```

### 步骤 6.2: 验证数据
```sql
-- 检查 agents 数量
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_player = true THEN 1 END) as player_agents,
  COUNT(CASE WHEN is_player = false THEN 1 END) as system_agents
FROM agents;
```

---

## 7. 修改前端代码

### 步骤 7.1: 修改 gameStore.ts
将本地存储替换为 Supabase 调用：

```typescript
// 修改前
initializeArena: () => {
  const systemAgents = generateSystemAgents(1000);
  set({ systemAgents });
},

// 修改后
initializeArena: async () => {
  // 从 Supabase 获取系统 Agents
  const systemAgents = await AgentService.getSystemAgents(1000);
  set({ 
    systemAgents: systemAgents.map(DataTransformers.toFrontendAgent) 
  });
},
```

### 步骤 7.2: 修改创建 Agent
```typescript
// 修改前
mintAgent: () => {
  const newAgent = generateAgent();
  set(state => ({ myAgents: [...state.myAgents, newAgent] }));
},

// 修改后
mintAgent: async (ownerId: string) => {
  const newAgent = generateAgent();
  const dbAgent = await AgentService.createAgent(
    DataTransformers.toDatabaseAgent(newAgent, ownerId)
  );
  set(state => ({ 
    myAgents: [...state.myAgents, DataTransformers.toFrontendAgent(dbAgent)] 
  }));
},
```

### 步骤 7.3: 添加实时订阅
```typescript
// 在 App.tsx 中添加
useEffect(() => {
  // 订阅 Agents 变化
  const subscription = RealtimeService.subscribeToAgents((payload) => {
    console.log('Agent updated:', payload);
    // 刷新 agents 数据
    refreshAgents();
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## 8. 部署

### 步骤 8.1: 配置生产环境变量
在部署平台（如 Vercel）添加环境变量：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 步骤 8.2: 构建项目
```bash
npm run build
```

### 步骤 8.3: 部署
```bash
# 如果使用 Vercel
vercel --prod

# 如果使用 Netlify
netlify deploy --prod
```

---

## 常见问题

### Q1: 连接超时
- 检查网络连接
- 确认 Supabase 项目是否处于 Active 状态
- 检查防火墙设置

### Q2: RLS 权限错误
- 确认已正确配置 RLS 策略
- 检查用户是否已登录（如果需要）
- 使用 Service Role Key 进行服务端操作

### Q3: 数据不实时同步
- 检查 Realtime 是否已启用（Database → Replication）
- 确认订阅代码正确
- 检查网络连接

---

## 数据库表结构

| 表名 | 说明 | 行数预估 |
|------|------|---------|
| users | 用户信息 | 10k+ |
| agents | Agents 数据 | 1000+ |
| battles | 战斗记录 | 100k+ |
| battle_logs | 战斗日志 | 1M+ |
| transactions | 交易记录 | 500k+ |
| prediction_markets | 预测市场 | 100+ |
| prediction_bets | 预测投注 | 10k+ |

---

## 下一步

1. ✅ 完成 Supabase 配置
2. 🔄 修改 gameStore 使用 Supabase
3. 🔄 添加用户认证
4. 🔄 实现实时战斗数据
5. 🔄 添加数据备份策略

---

## 参考链接

- [Supabase 文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime 订阅](https://supabase.com/docs/guides/realtime)
