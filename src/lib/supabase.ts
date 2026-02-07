import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// 数据库表名常量
export const TABLES = {
  AGENTS: 'agents',
  USERS: 'users',
  BATTLES: 'battles',
  BATTLE_LOGS: 'battle_logs',
  TRANSACTIONS: 'transactions',
  PREDICTION_MARKETS: 'prediction_markets',
  PREDICTION_BETS: 'prediction_bets',
} as const;

// 类型定义
export interface DatabaseAgent {
  id: string;
  owner_id: string;
  name: string;
  nft_id: number;
  color: string;
  image?: string;
  // 属性
  attack: number;
  defense: number;
  speed: number;
  crit_rate: number;
  crit_damage: number;
  evasion: number;
  accuracy: number;
  luck: number;
  // 战斗属性
  hp: number;
  max_hp: number;
  // 经济
  balance: number;
  // 统计
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  total_battles: number;
  win_rate: number;
  total_earnings: number;
  total_losses: number;
  net_profit: number;
  avg_damage_dealt: number;
  avg_damage_taken: number;
  max_kill_streak: number;
  current_kill_streak: number;
  tournament_wins: number;
  tournament_top3: number;
  // 状态
  status: 'idle' | 'in_arena' | 'fighting' | 'dead';
  is_player: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  created_at: string;
  updated_at: string;
}

export interface DatabaseUser {
  id: string;
  wallet_address?: string;
  twitter_id?: string;
  google_id?: string;
  email?: string;
  username?: string;
  avatar?: string;
  balance: number;
  total_profit: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBattle {
  id: string;
  round_number: number;
  participants: string[]; // agent ids
  winner_id?: string;
  started_at: string;
  ended_at?: string;
  total_prize: number;
  is_tournament: boolean;
  created_at: string;
}

export interface DatabaseBattleLog {
  id: string;
  battle_id: string;
  agent_id: string;
  opponent_id?: string;
  action_type: 'attack' | 'kill' | 'round_start' | 'round_end' | 'join' | 'leave';
  damage?: number;
  profit?: number;
  message: string;
  timestamp: string;
  created_at: string;
}

export interface DatabaseTransaction {
  id: string;
  user_id?: string;
  agent_id?: string;
  type: 'mint' | 'deposit' | 'withdraw' | 'battle_reward' | 'battle_loss' | 'prediction_bet' | 'prediction_win';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  tx_hash?: string;
  created_at: string;
}
