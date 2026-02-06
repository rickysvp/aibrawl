# AIBattle 版本更新日志

## 访问链接

- **本地开发环境**: http://localhost:5174/
- **线上生产环境**: https://aibattlex.vercel.app

---

## [1.8.14] - 2026-02-06

### 优化
- 将 Agent 卡片的快速存款和提款按钮移到卡片下方
- 按钮样式优化，使用圆角设计
- 保持存取款功能不变

---

## [1.8.13] - 2026-02-06

### 优化
- 钱包页面文本优化：提现→转账
- 小队 Agent 卡片添加快速存款和提款按钮
- 只有状态为 idle 的 Agent 才显示存取款按钮
- 点击存款/提款按钮显示输入框，输入金额后确认操作

---

## [1.8.12] - 2026-02-06

### 优化
- 流动性挖矿页面添加后退按钮，点击返回钱包页面
- 钱包里的流动性挖矿改为显示质押金额和待领取收益
- 添加箭头按钮点击跳转到流动性挖矿二级页面
- 锁定资产框已添加 withdraw 按钮，一键归集 Agents 余额

---

## [1.8.11] - 2026-02-06

### 优化
- 钱包页面文本优化：充值→存款，代币兑换→兑换
- 总资产区域添加完整钱包地址显示和复制功能
- Agents 入口改为流动性挖矿入口，点击进入挖矿页面
- 锁定资产框增加 withdraw 按钮，一键归集所有 Agents 余额
- 去掉 Tab Bar 的挖矿入口（改为从钱包页面进入）

---

## [1.8.10] - 2026-02-06

### 优化
- 钱包页面资产概览布局优化
- 充值、兑换、提现按钮与总资产合并到同一卡片
- 可用余额、锁定资产、Agents 放到总资产下方
- 总资产数字字体改为 font-mono，与余额字体一致
- 邀请好友模块优化
- 修复邀请描述 HTML 渲染问题
- 添加邀请链接显示和复制功能
- 添加分享按钮支持原生分享
- 邀请码和邀请链接分开显示

---

## [1.8.8] - 2026-02-06

### 优化
- 优化 Squad 页面标题样式，与 BATTLE 标题高度一致
- 统一使用 card-luxury 和 px-6 py-4 的标题样式

### 修复
- 修复轮次乱跳问题
- 移除 getTotalSystemRounds() 中的随机计算逻辑
- Top Bar Round 直接显示 totalSystemRounds，确保稳定递增
- BATTLE 标题轮次使用固定的 totalSystemRounds 值
- 每一轮战斗有固定的轮次编号，便于追溯

---

## [1.8.7] - 2026-02-06

### 修复
- 修复轮次乱跳问题
- 移除 getTotalSystemRounds() 中的随机计算逻辑
- Top Bar Round 直接显示 totalSystemRounds，确保稳定递增
- BATTLE 标题轮次使用固定的 totalSystemRounds 值
- 每一轮战斗有固定的轮次编号，便于追溯

---

## [1.8.6] - 2026-02-06

### 优化
- 重新设计轮次显示逻辑，支持战斗追溯
- Top Bar Round：持续递增，显示平台总战斗轮次
- BATTLE 标题轮次：战斗开始时固定，显示当前正在进行的轮次
- 战斗结束后才更新到新的轮次，方便统计每一轮的参与者和获胜者
- 结算层显示当前战斗轮次，支持历史追溯

---

## [1.8.5] - 2026-02-06

### 优化
- 优化轮次显示规则
- 标题旁边的轮次显示改为根据平台总轮次排序
- 顶部 Top Bar TVL 显示单位改为 MON
- 顶部 Top Bar 新增 Round 显示，展示平台当前战斗总轮次
- 结算层标题改为显示本轮轮次数，副标题显示前三名

---

## [1.8.4] - 2026-02-06

### 修复
- 全面修复 TypeScript 编译错误（共修复 48 个错误）
- 修复所有组件中未使用的导入和变量
- 修复 AgentCard.tsx 中未使用的 useGameStore 导入
- 修复 Arena.tsx 中未使用的 t 和 currentParticipants 变量
- 修复 PredictionMarket.tsx 中未使用的 autoBetRule 和 getStatusColor
- 修复 Squad.tsx 中未使用的导入和 earnings 属性（改为 netProfit）
- 修复 Tournament.tsx 中未使用的类型和导入
- 修复 Wallet.tsx 中未使用的导入和变量
- 修复 gameStore.ts 中的类型错误和未使用变量
- 修复 agentGenerator.ts 中 Agent 类型缺少的属性
- 添加 GameStore 接口中缺失的 createPredictionMarketForTournament 方法声明

---

## [1.8.3] - 2026-02-06

### 修复
- 修复 TypeScript 编译错误：清理未使用的变量和导入
- 修复 AgentCard.tsx 中的未使用图标和状态
- 修复 ArenaCanvas.tsx 中的未使用导入和变量
- 修复 BattleLog.tsx 中的未使用 title 属性
- 修复 Header.tsx 中的未使用状态和导入
- 修复 TournamentBracket.tsx 中的未使用类型和变量
- 修复 TournamentLiveMatch.tsx 中的未使用导入和状态
- 修复 TournamentProgress.tsx 中的未使用导入和变量
- 修复 Arena.tsx 中的未使用组件、变量和类型错误
- 修复 LiquidityMining.tsx 中的未使用导入
- 修复 PredictionMarket.tsx 中的未使用导入和类型

---

## [1.8.1] - 2026-02-06

### 修复
- 删除 pnpm-lock.yaml，统一使用 npm 作为包管理器
- 修复 Vercel 构建错误：解决 pnpm-lock.yaml 与 package.json 不同步的问题

---

## [1.8.1] - 2026-02-06

### 修复
- 修复 Vercel 配置冲突：将 `routes` 替换为 `rewrites`
- 更新版本号管理机制

---

## [1.0.1] - 2026-02-06

### 修复
- 修复 Vercel 配置中 `routes` 与 `headers` 冲突问题
- 更新版本号至 1.0.1

---

## 版本号规则

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范：

- **MAJOR**（主版本号）：当你做了不兼容的 API 修改
- **MINOR**（次版本号）：当你做了向下兼容的功能性新增
- **PATCH**（修订号）：当你做了向下兼容的问题修正

### 版本更新示例

- `1.8.1` → `1.8.2`：bug 修复或小优化
- `1.8.1` → `1.9.0`：新增功能
- `1.8.1` → `2.0.0`：重大更新或不兼容变更

---

## 提交规范

### 格式
```
[版本号]: [类型] - [简述]

[详细描述]
```

### 类型说明

- **Feat**: 新功能（feature）
- **Fix**: 修复 bug
- **Refactor**: 重构（即不是新增功能，也不是修改 bug 的代码变动）
- **Style**: 格式（不影响代码运行的变动）
- **Docs**: 文档（documentation）
- **Chore**: 构建过程或辅助工具的变动

### 示例
```
[1.9.0]: Feat - 添加 Agent 战斗动画效果

- 新增战斗场景动画组件
- 优化战斗结果展示界面
- 添加音效支持
```

---

## 历史版本

<details>
<summary>点击查看完整版本历史</summary>

### [1.0.0] - 初始版本
- Agent NFT 系统
- 战斗统计功能
- 赢率和盈亏数据显示
- Agent 详情弹窗

</details>
