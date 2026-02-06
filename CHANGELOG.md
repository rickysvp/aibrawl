# AIBattle 版本更新日志

## 访问链接

- **本地开发环境**: http://localhost:5174/
- **线上生产环境**: https://aibattlex.vercel.app

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
