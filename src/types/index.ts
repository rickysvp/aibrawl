// Agent 类型定义
export interface Agent {
  id: string;
  name: string;
  color: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  balance: number;
  wins: number;
  losses: number;
  kills: number;
  earnings: number;
  status: 'idle' | 'in_arena' | 'fighting' | 'dead';
  position?: { x: number; y: number };
  isPlayer: boolean;
  pixelStyle: number; // 像素风格变体
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
export type RoundPhase = 'waiting' | 'selecting' | 'countdown' | 'fighting' | 'settlement';

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
}

// 锦标赛类型
export interface Tournament {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  prizePool: number;
  participants: number;
  maxParticipants: number;
  startTime: number;
  endTime?: number;
  entryFee: number;
  winners?: { agent: Agent; prize: number; rank: number }[];
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
