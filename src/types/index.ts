// 稀有度类型
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Agent 类型定义
export interface Agent {
  id: string;
  name: string;
  nftId: number;       // NFT编号
  color: string;
  image?: string;      // NFT头像图片路径
  // 基础属性 (11-99, 总和<333)
  attack: number;      // 攻击力
  defense: number;     // 防御力
  crit: number;        // 暴击率
  hit: number;         // 命中率
  agility: number;     // 敏捷
  totalStats: number;  // 属性总和
  rarity: Rarity;      // 稀有度
  // 战斗属性
  hp: number;
  maxHp: number;
  // 经济
  balance: number;
  // 基础统计
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  // 详细统计
  totalBattles: number;
  winRate: number; // 胜率百分比
  totalEarnings: number; // 总收益
  totalLosses: number; // 总亏损
  netProfit: number; // 净利润
  avgDamageDealt: number; // 平均造成伤害
  avgDamageTaken: number; // 平均承受伤害
  maxKillStreak: number; // 最高连杀
  currentKillStreak: number; // 当前连杀
  tournamentWins: number; // 锦标赛冠军次数
  tournamentTop3: number; // 锦标赛前三次数
  // 历史记录
  battleHistory: BattleRecord[];
  // 状态
  status: 'idle' | 'in_arena' | 'fighting' | 'dead';
  position?: { x: number; y: number };
  isPlayer: boolean;
  pixelStyle: number; // 像素风格变体
  createdAt: number; // 创建时间
}

// 战斗记录
export interface BattleRecord {
  id: string;
  timestamp: number;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  damageDealt: number;
  damageTaken: number;
  earnings: number;
  kills: number;
  isTournament: boolean;
  tournamentName?: string;
  rank?: number;
}

// 战斗日志类型
export interface BattleLog {
  id: string;
  timestamp: number;
  type: 'attack' | 'kill' | 'damage' | 'round_start' | 'round_end' | 'join' | 'leave';
  attacker?: Agent;
  defender?: Agent;
  damage?: number;
  message: string;
  isHighlight?: boolean;
}

// 战斗轮次状态
export type RoundPhase = 'waiting' | 'selecting' | 'loading' | 'countdown' | 'fighting' | 'settlement';

// 竞技场状态
export interface ArenaState {
  phase: RoundPhase;
  roundNumber: number;
  countdown: number;
  participants: Agent[];
  selectedSlots: number[];
  battleLogs: BattleLog[];
  top3: { agent: Agent; profit: number }[];
}

// 钱包状态
export interface WalletState {
  connected: boolean;
  address: string;
  balance: number;
  lockedBalance: number;
  loginType: 'twitter' | 'google' | 'wallet' | null;
  nickname: string;
  avatar: string;
}

// 锦标赛类型
export type TournamentType = 'challenge' | 'daily' | 'weekly';
export type TournamentStatus = 'upcoming' | 'registration' | 'ongoing' | 'finished';
export type TournamentRound = 'round128' | 'round32' | 'round8' | 'semifinal' | 'final';

// 锦标赛报名记录
export interface TournamentEntry {
  id: string;
  tournamentId: string;
  userId: string;
  agentId: string;
  agent: Agent;
  entryFee: number;
  registeredAt: number;
  eliminatedAt?: number;
  finalRank?: number;
  prize?: number;
}

// 锦标赛对阵
export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: TournamentRound;
  matchIndex: number;
  agentA?: Agent;
  agentB?: Agent;
  winnerId?: string;
  startTime?: number;
  endTime?: number;
  bets?: PredictionBet[];
}

// 锦标赛类型
export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  prizePool: number;
  participants: Agent[];
  maxParticipants: number;
  startTime: number;
  endTime?: number;
  entryFee: number;
  winners?: { agent: Agent; prize: number; rank: number }[];
  currentRound: TournamentRound;
  matches: TournamentMatch[];
  qualifiedAgents: Agent[];
  history?: TournamentHistory;
}

// 锦标赛历史记录
export interface TournamentHistory {
  tournamentId: string;
  type: TournamentType;
  name: string;
  startTime: number;
  endTime: number;
  totalParticipants: number;
  winner: Agent;
  prizePool: number;
  matches: TournamentMatch[];
}

// 锦标赛自动化设置
export interface TournamentAutoSettings {
  enabled: boolean;
  challenge: {
    enabled: boolean;
    preferredAgentId?: string;
    autoSelect: boolean;
  };
  daily: {
    enabled: boolean;
    preferredAgentId?: string;
    autoSelect: boolean;
  };
  weekly: {
    enabled: boolean;
    preferredAgentId?: string;
    autoSelect: boolean;
  };
}

// 子弹/攻击特效
export interface Projectile {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  progress: number;
}

// 伤害飘字
export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  timestamp: number;
}

// 资金转移飘字
export interface CoinTransfer {
  id: string;
  x: number;
  y: number;
  amount: number;
  timestamp: number;
}

// 余额变化飘字（加血/减血）
export interface BalanceChange {
  id: string;
  x: number;
  y: number;
  amount: number;
  isGain: boolean;
  timestamp: number;
}

// ==================== 流动性挖矿类型 ====================

// 用户质押记录
export interface LiquidityStake {
  id: string;
  userId: string;
  amount: number;
  stakedAt: number;
  rewards: number;
  unlockTime: number;
  lastClaimTime: number;
}

// 流动性池
export interface LiquidityPool {
  totalStaked: number;
  totalRewards: number;
  apr: number;
  rewardRate: number;
  stakerCount: number;
}

// ==================== 预测市场类型 ====================

// 预测下注
export interface PredictionBet {
  id: string;
  userId: string;
  marketId: string;
  tournamentId: string;
  predictedAgentId: string;
  betAmount: number;
  betType: 'semifinal' | 'final' | 'match';
  odds: number;
  status: 'pending' | 'won' | 'lost';
  potentialWin: number;
  createdAt: number;
}

// 预测市场
export interface PredictionMarket {
  id: string;
  tournamentId: string;
  matchId?: string;
  name: string;
  totalPool: number;
  odds: Record<string, number>;
  status: 'open' | 'closed' | 'settled';
  deadline: number;
  betType: 'semifinal' | 'final' | 'match';
  participants: string[];
}

// 自动下注规则
export interface AutoBetRule {
  enabled: boolean;
  betAmount: number;
  strategy: 'always' | 'top_ranked' | 'specified';
  maxBetsPerDay: number;
  specifiedAgentIds?: string[];
  minOdds?: number;
  maxOdds?: number;
}
