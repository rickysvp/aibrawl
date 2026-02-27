import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Agent, BattleLog, ArenaState, WalletState, Tournament, RoundPhase,
  LiquidityPool, LiquidityStake, LiquidityEarning,
  TournamentRound, TournamentEntry, TournamentMatch,
  TournamentAutoSettings, TournamentHistory
} from '../types';
import { generateRandomAgent, generateSystemAgents, TOURNAMENT_SYSTEM_AGENTS } from '../utils/agentGenerator';
import { useNotificationStore } from './notificationStore';
import { AgentService, UserService, TransactionService, DataTransformers, LiquidityService } from '../services/database';

interface GameStore {
  // 钱包状态
  wallet: WalletState;
  connectWallet: (nickname: string, type?: 'twitter' | 'google' | 'wallet') => void;
  disconnectWallet: () => void;

  // 玩家的 Agents
  myAgents: Agent[];
  mintAgent: () => Promise<Agent | null>;
  allocateFunds: (agentId: string, amount: number) => void;
  withdrawFunds: (agentId: string, amount: number) => void;
  joinArena: (agentId: string) => void;
  leaveArena: (agentId: string) => void;

  // 竞技场状态
  arena: ArenaState;
  systemAgents: Agent[];
  initializeArena: () => void;
  startNewRound: () => void;
  setArenaPhase: (phase: RoundPhase) => void;
  addBattleLog: (log: Omit<BattleLog, 'id' | 'timestamp'>) => void;
  updateParticipant: (agentId: string, updates: Partial<Agent>) => void;
  setTop3: (top3: { agent: Agent; profit: number }[]) => void;

  // 我的战斗日志
  myBattleLogs: BattleLog[];

  // 锦标赛
  tournaments: Tournament[];
  tournamentEntries: TournamentEntry[];
  tournamentHistory: TournamentHistory[];
  tournamentAutoSettings: TournamentAutoSettings;
  registerForTournament: (tournamentId: string, agentId: string) => { success: boolean; message: string };
  setTournamentAutoSettings: (settings: Partial<TournamentAutoSettings>) => void;
  executeAutoTournamentRegistration: () => void;
  fillTournamentWithSystemAgents: (tournamentId: string) => void;
  startTournament: (tournamentId: string) => void;
  advanceTournamentRound: (tournamentId: string) => void;
  getQualifiedAgentsForTournament: (tournamentId: string) => Agent[];
  simulateMatch: (agentA: Agent, agentB: Agent) => Agent;
  executeCurrentRound: (tournamentId: string) => void;
  runFastTournament: (tournamentId: string) => void;
  createChallengeTournament: () => string;
  startTournamentScheduler: () => void;

  // 铸造费用
  mintCost: number;

  // 系统全局轮次计数（所有并行竞技场总和）
  totalSystemRounds: number;
  lastSystemRoundUpdate: number;
  incrementSystemRound: () => void;
  getTotalSystemRounds: () => number;

  // ==================== 流动性挖矿 ====================
  liquidityPool: LiquidityPool;
  userStakes: LiquidityStake[];
  stakeLiquidity: (amount: number) => Promise<{ success: boolean; message: string }>;
  unstakeLiquidity: (stakeId: string) => Promise<{ success: boolean; message: string }>;
  claimLiquidityRewards: () => { success: boolean; amount: number; message: string };
  // 计算实时收益（包括手续费收益）
  calculateRewards: (stake: LiquidityStake) => number;
  // 计算手续费收益
  calculateFeeEarnings: (stake: LiquidityStake) => number;
  getDynamicAPR: () => number;
  // 分配手续费到流动性池（50%给LP，50%平台留存）
  distributeFeeToLiquidityPool: (amount: number) => void;
  // 每小时结算一次收益
  settleLiquidityEarnings: () => void;
  // 获取实时APY（包含手续费收益）
  getRealTimeAPY: () => number;

  // ==================== 后台自动战斗系统 ====================
  autoBattleInterval: number | null;
  startAutoBattleSystem: () => void;
  stopAutoBattleSystem: () => void;
  simulateAutoBattle: () => void;
  getRandomAgentBattleHistory: (agentId: string) => { battle: any; opponent: Agent | null; result: string; profit: number } | null;

  // ==================== 平台收入 ====================
  platformRevenue: number;
  addPlatformRevenue: (amount: number) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
  // 钱包初始状态
  wallet: {
    connected: false,
    address: '',
    balance: 10000,
    lockedBalance: 0,
    loginType: null,
    nickname: '',
    avatar: '',
  },

  connectWallet: async (nickname: string, type: 'twitter' | 'google' | 'wallet' = 'wallet') => {
    // 尝试从 localStorage 获取已存在的模拟钱包地址，模拟真实的钱包体验
    let storedAddress = localStorage.getItem('mock_wallet_address');
    
    if (!storedAddress) {
      storedAddress = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      localStorage.setItem('mock_wallet_address', storedAddress);
    }

    const randomAddress = storedAddress;

    // 生成头像
    let avatar = '';
    if (type === 'twitter') {
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAddress}&backgroundColor=1da1f2`;
    } else if (type === 'google') {
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAddress}&backgroundColor=4285f4`;
    } else {
      avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${randomAddress}&backgroundColor=b6e3f4`;
    }

    // 预登录：立即设置登录状态，让用户可以立即使用界面
    const userId = randomAddress;
    
    // 检查是否是重新登录（store中是否已有该用户的余额信息）
    // 注意：由于使用了 persist，这里 get().wallet 可能已经是旧数据，但如果是 disconnect 后再 connect，
    // 我们希望恢复之前的状态。
    // 如果是全新生成的地址，默认 10000。如果是旧地址，尝试从后端或本地恢复。
    
    // 这里我们先设置默认值，然后依靠下方的 UserService 获取真实数据
    const userBalance = 10000; 

    set({
      wallet: {
        connected: true,
        address: randomAddress,
        balance: userBalance,
        lockedBalance: 0,
        loginType: type,
        nickname,
        avatar,
        userId,
      }
    });

    useNotificationStore.getState().addNotification('success', `Connected as ${nickname}`, 'Wallet Connected');

    // 后台异步保存用户到 Supabase（不阻塞用户体验）
    (async () => {
      try {
        // 先尝试获取用户，看是否存在
        // 注意：getOrCreateUser 会更新用户信息，但我们想保留余额
        // 这里简化逻辑：总是调用 getOrCreateUser，它应该返回最新数据
        
        const userData: any = {
          username: nickname,
          avatar,
          // 不传 balance，防止重置为 10000。只有创建新用户时 Supabase 可能会使用默认值
        };

        if (type === 'wallet') {
          userData.wallet_address = randomAddress;
        } else if (type === 'twitter') {
          userData.twitter_id = randomAddress;
        } else if (type === 'google') {
          userData.google_id = randomAddress;
        }

        console.log('[Wallet] Creating/updating user:', userData);
        const user = await UserService.getOrCreateUser(userData);

        if (user && user.id) {
          // 更新真实的 userId 和余额
          // 如果是老用户，user.balance 应该是数据库里的值
          set((state) => ({
            wallet: {
              ...state.wallet,
              userId: user.id,
              balance: user.balance !== undefined ? user.balance : state.wallet.balance,
            }
          }));
          console.log(`[Wallet] User saved to Supabase: ${nickname} (${user.id}), Balance: ${user.balance}`);

          // 加载用户的 Agents
          try {
            const userAgents = await AgentService.getUserAgents(user.id);
            if (userAgents.length > 0) {
              const frontendAgents = userAgents.map(DataTransformers.toFrontendAgent);
              // 计算 lockedBalance = 所有 Agent 余额总和
              const totalLockedBalance = frontendAgents.reduce((sum, agent) => sum + agent.balance, 0);
              
              set((state) => ({
                myAgents: frontendAgents,
                wallet: {
                  ...state.wallet,
                  lockedBalance: totalLockedBalance,
                }
              }));
              console.log(`[Wallet] Loaded ${userAgents.length} agents for user ${nickname}, lockedBalance: ${totalLockedBalance}`);
            }
          } catch (agentError) {
            console.error('[Wallet] Failed to load user agents:', agentError);
          }

          // 加载用户的流动性质押
          try {
            console.log(`[Wallet] Loading liquidity stakes for address: ${randomAddress}`);
            const userStakes = await LiquidityService.getUserActiveStakes(randomAddress);
            console.log(`[Wallet] Found ${userStakes.length} liquidity stakes`);
            if (userStakes.length > 0) {
              const frontendStakes: LiquidityStake[] = userStakes.map(dbStake => ({
                id: dbStake.id,
                userId: dbStake.user_address,
                amount: dbStake.amount,
                stakedAt: new Date(dbStake.staked_at).getTime(),
                rewards: 0,
                unlockTime: new Date(dbStake.unlock_time).getTime(),
                lastClaimTime: new Date(dbStake.last_claim_time).getTime(),
                totalFeeEarnings: dbStake.total_fee_earnings,
                lastSettlementTime: new Date(dbStake.updated_at).getTime(),
                earnings: [],
              }));
              
              set({
                userStakes: frontendStakes,
              });
              console.log(`[Wallet] Loaded ${userStakes.length} liquidity stakes for user ${nickname}`);
            } else {
              console.log(`[Wallet] No liquidity stakes found for user ${nickname}`);
            }
          } catch (stakeError) {
            console.error('[Wallet] Failed to load liquidity stakes:', stakeError);
          }

          // 加载流动性池状态
          try {
            const pool = await LiquidityService.getLiquidityPool();
            if (pool) {
              set((state) => ({
                liquidityPool: {
                  ...state.liquidityPool,
                  totalStaked: pool.total_staked,
                  totalRewards: pool.total_rewards,
                  apr: pool.apr,
                  stakerCount: pool.staker_count,
                  feeRevenuePool: pool.fee_revenue_pool,
                  totalFeeDistributed: pool.total_fee_distributed,
                }
              }));
              console.log(`[Wallet] Loaded liquidity pool state`);
            }
          } catch (poolError) {
            console.error('[Wallet] Failed to load liquidity pool:', poolError);
          }
        }
      } catch (error) {
        console.error('[Wallet] Failed to save user:', error);
      }
    })();
  },

  disconnectWallet: () => {
    set({
      wallet: {
        connected: false,
        address: '',
        balance: 0,
        lockedBalance: 0,
        loginType: null,
        nickname: '',
        avatar: '',
      },
      myAgents: [],
    });
  },
  
  // 玩家 Agents
  myAgents: [],
  mintCost: 100,
  
  mintAgent: async () => {
    const { wallet, mintCost } = get();
    if (!wallet.connected || wallet.balance < mintCost) {
      console.error('[Mint] Failed: Wallet not connected or insufficient balance');
      return null;
    }

    try {
      // 使用用户昵称生成 Agent 名称
      const userNickname = wallet.nickname;
      // 使用 wallet.address 作为 userId（简化逻辑，避免 Supabase 查询阻塞）
      const userId = wallet.userId || wallet.address || 'anonymous';

      console.log('[Mint] Starting mint process...');
      console.log('[Mint] User ID:', userId);
      console.log('[Mint] User nickname:', userNickname);

      // 生成新 Agent（使用用户昵称作为前缀）
      const newAgent = generateRandomAgent(true, true, userNickname);
      console.log('[Mint] Generated agent:', newAgent.name);

      // 直接更新本地状态，不等待 Supabase
      set((state) => ({
        wallet: { ...state.wallet, balance: state.wallet.balance - mintCost },
        myAgents: [...state.myAgents, newAgent],
      }));

      // 后台异步保存到 Supabase（不阻塞用户体验）
      (async () => {
        try {
          // 准备数据库数据
          const agentData = DataTransformers.toDatabaseAgent(newAgent, userId);
          console.log('[Mint] Saving to Supabase...');
          const dbAgent = await AgentService.createAgent({
            ...agentData,
            balance: 0,
          });
          console.log('[Mint] Agent saved to DB:', dbAgent.id);

          // 创建交易记录
          await TransactionService.createTransaction({
            user_id: userId,
            agent_id: dbAgent.id,
            type: 'mint',
            amount: -mintCost,
            status: 'completed',
          });
        } catch (dbError) {
          console.error('[Mint] Background save failed:', dbError);
        }
      })();

      useNotificationStore.getState().addNotification('success', `Minted ${newAgent.name} successfully`, 'Agent Minted');
      return newAgent;
    } catch (error: any) {
      console.error('[Mint] Failed with error:', error);
      useNotificationStore.getState().addNotification('error', `Failed to mint agent: ${error.message}`, 'Error');
      return null;
    }
  },
  
  // 计算 lockedBalance = 所有 Agents 余额总和
  calculateLockedBalance: () => {
    const { myAgents } = get();
    return myAgents.reduce((sum, a) => sum + a.balance, 0);
  },
  
  allocateFunds: (agentId: string, amount: number) => {
    const { wallet } = get();
    if (wallet.balance < amount) return;
    
    set((state) => {
      const newMyAgents = state.myAgents.map(a => 
        a.id === agentId ? { ...a, balance: a.balance + amount } : a
      );
      // 重新计算 lockedBalance
      const newLockedBalance = newMyAgents.reduce((sum, a) => sum + a.balance, 0);
      
      return {
        wallet: { 
          ...state.wallet, 
          balance: state.wallet.balance - amount,
          lockedBalance: newLockedBalance,
        },
        myAgents: newMyAgents,
      };
    });
    
    useNotificationStore.getState().addNotification('success', `Allocated ${amount} MON to agent`, 'Funds Allocated');
  },
  
  withdrawFunds: (agentId: string, amount: number) => {
    const agent = get().myAgents.find(a => a.id === agentId);
    // 只有不在战斗中才能提现
    if (!agent || agent.balance < amount || agent.status === 'fighting') return;
    
    set((state) => {
      const newMyAgents = state.myAgents.map(a => 
        a.id === agentId ? { ...a, balance: a.balance - amount } : a
      );
      // 重新计算 lockedBalance
      const newLockedBalance = newMyAgents.reduce((sum, a) => sum + a.balance, 0);
      
      return {
        wallet: { 
          ...state.wallet, 
          balance: state.wallet.balance + amount,
          lockedBalance: newLockedBalance,
        },
        myAgents: newMyAgents,
      };
    });
    
    useNotificationStore.getState().addNotification('success', `Withdrew ${amount} MON from agent`, 'Funds Withdrawn');
  },
  
  joinArena: (agentId: string) => {
    const agent = get().myAgents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'idle' || agent.balance <= 0) return;
    
    set((state) => ({
      myAgents: state.myAgents.map(a => 
        a.id === agentId ? { ...a, status: 'in_arena' } : a
      ),
    }));
    
    useNotificationStore.getState().addNotification('success', `${agent.name} joined the arena`, 'Arena Joined');
  },
  
  leaveArena: (agentId: string) => {
    const agent = get().myAgents.find(a => a.id === agentId);
    if (!agent || agent.status === 'fighting') return;
    
    set((state) => ({
      myAgents: state.myAgents.map(a => 
        a.id === agentId ? { ...a, status: 'idle' } : a
      ),
    }));
  },
  
  // 竞技场状态
  arena: {
    phase: 'waiting',
    roundNumber: 0,
    countdown: 0,
    participants: [],
    selectedSlots: [],
    battleLogs: [],
    top3: [],
  },
  
  systemAgents: [],
  
  initializeArena: async () => {
    const state = get();
    
    // 如果已经有系统Agents（从localStorage恢复），直接使用
    if (state.systemAgents.length > 0) {
      console.log(`[Arena] 从本地存储恢复 ${state.systemAgents.length} 个系统Agents`);
      
      // 重置所有 fighting 状态的 Agent 为 in_arena
      set({
        systemAgents: state.systemAgents.map(a => 
          a.status === 'fighting' ? { ...a, status: 'in_arena' as const } : a
        ),
        myAgents: state.myAgents.map(a => 
          a.status === 'fighting' ? { ...a, status: 'in_arena' as const } : a
        ),
      });
    } else {
      // 首次加载，生成系统Agents
      console.log('[Arena] 首次加载，生成系统Agents...');
      const systemAgents = generateSystemAgents(1000).map(agent => ({
        ...agent,
        status: 'in_arena' as const,
        balance: 10000,
      }));
      set({ systemAgents });
      console.log('[Arena] 1000个系统Agents已生成');
    }
    
    // 启动后台自动战斗系统
    if (!state.autoBattleInterval) {
      state.startAutoBattleSystem();
    }
  },
  
  startNewRound: () => {
    set((state) => ({
      arena: {
        ...state.arena,
        roundNumber: state.arena.roundNumber + 1,
        phase: 'selecting',
        participants: [],
        selectedSlots: [],
        top3: [],
      }
    }));
  },
  
  setArenaPhase: (phase: RoundPhase) => {
    set((state) => ({
      arena: { ...state.arena, phase }
    }));
  },
  
  addBattleLog: (log) => {
    const newLog: BattleLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    
    set((state) => {
      const newBattleLogs = [newLog, ...state.arena.battleLogs].slice(0, 100);
      
      // 如果涉及玩家的 Agent，也添加到我的战斗日志
      const isMyAgent = (agent?: Agent) => agent?.isPlayer;
      const isMyBattle = isMyAgent(log.attacker) || isMyAgent(log.defender);
      
      return {
        arena: { ...state.arena, battleLogs: newBattleLogs },
        myBattleLogs: isMyBattle 
          ? [newLog, ...state.myBattleLogs].slice(0, 50)
          : state.myBattleLogs,
      };
    });
  },
  
  updateParticipant: (agentId: string, updates: Partial<Agent>) => {
    set((state) => {
      const newMyAgents = state.myAgents.map(a =>
        a.id === agentId ? { ...a, ...updates } : a
      );
      // 如果更新了余额，重新计算 lockedBalance
      const newLockedBalance = updates.balance !== undefined
        ? newMyAgents.reduce((sum, a) => sum + a.balance, 0)
        : state.wallet.lockedBalance;
      
      return {
        arena: {
          ...state.arena,
          participants: state.arena.participants.map(a =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        },
        myAgents: newMyAgents,
        systemAgents: state.systemAgents.map(a =>
          a.id === agentId ? { ...a, ...updates } : a
        ),
        wallet: {
          ...state.wallet,
          lockedBalance: newLockedBalance,
        }
      };
    });
  },
  
  setTop3: (top3) => {
    set((state) => ({
      arena: { ...state.arena, top3 }
    }));
  },
  
  // 我的战斗日志
  myBattleLogs: [],

  // 锦标赛
  tournaments: [
    {
      id: 'challenge-1',
      name: 'Challenge Arena #1',
      type: 'challenge',
      status: 'registration',
      prizePool: 5000,
      participants: [],
      maxParticipants: 128,
      startTime: Date.now() + 300000,
      entryFee: 100,
      currentRound: 'round128',
      matches: [],
      qualifiedAgents: [],
    },
    {
      id: 'daily-1',
      name: 'Daily Championship',
      type: 'daily',
      status: 'upcoming',
      prizePool: 100000,
      participants: [],
      maxParticipants: 128,
      startTime: Date.now() + 3600000,
      entryFee: 1000,
      currentRound: 'round128',
      matches: [],
      qualifiedAgents: [],
    },
    {
      id: 'weekly-1',
      name: 'Weekly Grand Championship',
      type: 'weekly',
      status: 'upcoming',
      prizePool: 1000000,
      participants: [],
      maxParticipants: 128,
      startTime: Date.now() + 86400000,
      entryFee: 10000,
      currentRound: 'round128',
      matches: [],
      qualifiedAgents: [],
    },
  ],

  // 锦标赛报名记录
  tournamentEntries: [],

  // 锦标赛历史
  tournamentHistory: [],

  // 锦标赛自动报名设置
  tournamentAutoSettings: {
    enabled: false,
    challenge: { enabled: false, autoSelect: true },
    daily: { enabled: false, autoSelect: true },
    weekly: { enabled: false, autoSelect: true },
  },

  // 系统全局轮次计数（所有并行竞技场总和）
  totalSystemRounds: 5, // 从个位数开始
  lastSystemRoundUpdate: Date.now(),

  incrementSystemRound: () => {
    set((state) => ({
      totalSystemRounds: state.totalSystemRounds + 1,
      lastSystemRoundUpdate: Date.now(),
    }));
  },

  getTotalSystemRounds: () => {
    const state = get();
    const now = Date.now();
    const elapsed = now - state.lastSystemRoundUpdate;
    // 随机增加 1-5 轮，模拟多个竞技场并行运行
    const additionalRounds = Math.floor(elapsed / 300) * (Math.floor(Math.random() * 5) + 1);
    return state.totalSystemRounds + additionalRounds;
  },

  // ==================== 流动性挖矿实现（重构版）====================
  liquidityPool: {
    totalStaked: 500000,
    totalRewards: 25000,
    apr: 25,
    rewardRate: 25 / (365 * 24 * 60 * 60 * 1000), // 每毫秒奖励率
    stakerCount: 128,
    feeRevenuePool: 0, // 手续费收益池
    totalFeeDistributed: 0, // 累计分配的手续费
  },
  userStakes: [],

  getDynamicAPR: () => {
    const { liquidityPool } = get();
    // APR 动态调整：质押越多，APR 越低
    const baseAPR = 50;
    const minAPR = 5;
    const decayFactor = liquidityPool.totalStaked / 1000000; // 每100万质押降低APR
    return Math.max(minAPR, baseAPR - decayFactor * 10);
  },

  calculateRewards: (stake: LiquidityStake) => {
    const now = Date.now();
    const elapsedMs = now - stake.lastClaimTime;
    const { liquidityPool } = get();
    return stake.amount * liquidityPool.rewardRate * elapsedMs;
  },

  calculateFeeEarnings: (stake: LiquidityStake) => {
    const { liquidityPool } = get();
    if (liquidityPool.totalStaked === 0) return 0;
    const share = stake.amount / liquidityPool.totalStaked;
    return liquidityPool.feeRevenuePool * share;
  },

  getRealTimeAPY: () => {
    const { liquidityPool } = get();
    const baseAPR = liquidityPool.apr;
    let feeAPR = 0;
    if (liquidityPool.totalStaked > 0) {
      const annualFeeEstimate = liquidityPool.totalFeeDistributed * 365;
      feeAPR = (annualFeeEstimate / liquidityPool.totalStaked) * 100;
    }
    return baseAPR + feeAPR;
  },

  distributeFeeToLiquidityPool: (amount: number) => {
    const lpShare = amount * 0.5;
    const platformShare = amount * 0.5;
    set((state) => ({
      platformRevenue: state.platformRevenue + platformShare,
      liquidityPool: {
        ...state.liquidityPool,
        feeRevenuePool: state.liquidityPool.feeRevenuePool + lpShare,
        totalFeeDistributed: state.liquidityPool.totalFeeDistributed + lpShare,
      },
    }));
  },

  settleLiquidityEarnings: () => {
    const { userStakes, liquidityPool } = get();
    if (liquidityPool.feeRevenuePool <= 0 || userStakes.length === 0) return;
    const now = Date.now();
    const updatedStakes = userStakes.map((stake) => {
      const feeEarnings = get().calculateFeeEarnings(stake);
      if (feeEarnings <= 0) return stake;
      const newEarning: LiquidityEarning = {
        id: `earning-${now}-${stake.id}`,
        stakeId: stake.id,
        amount: feeEarnings,
        timestamp: now,
        source: 'fee',
      };
      return {
        ...stake,
        totalFeeEarnings: stake.totalFeeEarnings + feeEarnings,
        lastSettlementTime: now,
        earnings: [...stake.earnings, newEarning],
      };
    });
    set((state) => ({
      userStakes: updatedStakes,
      liquidityPool: {
        ...state.liquidityPool,
        feeRevenuePool: 0,
      },
    }));
  },

  stakeLiquidity: async (amount: number) => {
    const { wallet } = get();

    if (!wallet.connected) {
      return { success: false, message: 'Please connect wallet first' };
    }

    if (wallet.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    if (amount < 100) {
      return { success: false, message: 'Minimum stake amount is 100 MON' };
    }

    const now = Date.now();
    
    try {
      console.log(`[Stake] Creating stake for address: ${wallet.address}, amount: ${amount}`);
      // 先保存到Supabase（不指定id，让数据库自动生成uuid）
      const dbStake = await LiquidityService.createStake({
        user_id: wallet.userId || wallet.address,
        user_address: wallet.address,
        amount: amount,
        staked_at: new Date(now).toISOString(),
        unlock_time: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_claim_time: new Date(now).toISOString(),
        total_fee_earnings: 0,
        status: 'active',
      });
      console.log(`[Stake] Stake created successfully: ${dbStake.id}`);

      // 创建交易记录
      await TransactionService.createTransaction({
        user_id: wallet.userId || wallet.address,
        type: 'liquidity_stake',
        amount: -amount,
        status: 'completed',
      });

      // 更新流动性池
      const newTotalStaked = get().liquidityPool.totalStaked + amount;
      await LiquidityService.updateLiquidityPool({
        total_staked: newTotalStaked,
        staker_count: get().userStakes.length + 1,
        apr: get().getDynamicAPR(),
      });

      // 更新本地状态
      const newStake: LiquidityStake = {
        id: dbStake.id,
        userId: wallet.address,
        amount,
        stakedAt: now,
        rewards: 0,
        unlockTime: now + 7 * 24 * 60 * 60 * 1000,
        lastClaimTime: now,
        totalFeeEarnings: 0,
        lastSettlementTime: now,
        earnings: [],
      };

      set((state) => ({
        wallet: { ...state.wallet, balance: state.wallet.balance - amount },
        liquidityPool: {
          ...state.liquidityPool,
          totalStaked: newTotalStaked,
          stakerCount: state.userStakes.length + 1,
          apr: get().getDynamicAPR(),
        },
        userStakes: [...state.userStakes, newStake],
      }));

      useNotificationStore.getState().addNotification('success', `Staked ${amount} MON successfully`, 'Liquidity Staked');
      return { success: true, message: 'Staked successfully' };
    } catch (error: any) {
      console.error('[Stake] Failed:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      useNotificationStore.getState().addNotification('error', `Failed to stake: ${errorMessage}`, 'Error');
      return { success: false, message: `Failed to stake: ${errorMessage}` };
    }
  },

  unstakeLiquidity: async (stakeId: string) => {
    const { wallet, userStakes } = get();
    const stake = userStakes.find((s) => s.id === stakeId);

    if (!stake) {
      return { success: false, message: 'Stake not found' };
    }

    const now = Date.now();
    const isEarly = now < stake.unlockTime;
    const penalty = isEarly ? stake.amount * 0.2 : 0;
    const returnAmount = stake.amount - penalty;
    const baseRewards = get().calculateRewards(stake);
    const feeEarnings = get().calculateFeeEarnings(stake);
    const totalRewards = baseRewards + feeEarnings;

    try {
      // 更新Supabase中的质押状态
      await LiquidityService.unstake(stakeId, stake.totalFeeEarnings + feeEarnings);

      // 创建交易记录
      await TransactionService.createTransaction({
        user_id: wallet.userId || wallet.address,
        type: 'liquidity_unstake',
        amount: returnAmount,
        status: 'completed',
      });

      if (totalRewards > 0) {
        await TransactionService.createTransaction({
          user_id: wallet.userId || wallet.address,
          type: 'liquidity_reward',
          amount: totalRewards,
          status: 'completed',
        });
      }

      // 更新流动性池
      await LiquidityService.updateLiquidityPool({
        total_staked: get().liquidityPool.totalStaked - stake.amount,
        staker_count: Math.max(0, userStakes.length - 1),
      });

      // 更新本地状态
      set((state) => ({
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance + returnAmount + totalRewards,
        },
        liquidityPool: {
          ...state.liquidityPool,
          totalStaked: state.liquidityPool.totalStaked - stake.amount,
          stakerCount: Math.max(0, state.userStakes.length - 1),
        },
        userStakes: state.userStakes.filter((s) => s.id !== stakeId),
      }));

      const message = isEarly
        ? `Unstaked with 20% early withdrawal penalty. Received ${returnAmount.toFixed(2)} MON + ${totalRewards.toFixed(2)} rewards (${feeEarnings.toFixed(2)} from fees)`
        : `Unstaked successfully. Received ${returnAmount.toFixed(2)} MON + ${totalRewards.toFixed(2)} rewards (${feeEarnings.toFixed(2)} from fees)`;

      useNotificationStore.getState().addNotification(isEarly ? 'warning' : 'success', message, 'Liquidity Unstaked');

      return { success: true, message };
    } catch (error) {
      console.error('[Unstake] Failed:', error);
      useNotificationStore.getState().addNotification('error', 'Failed to unstake', 'Error');
      return { success: false, message: 'Failed to unstake' };
    }
  },

  claimLiquidityRewards: () => {
    const { wallet, userStakes } = get();

    if (!wallet.connected) {
      return { success: false, amount: 0, message: 'Please connect wallet first' };
    }

    let totalRewards = 0;
    const now = Date.now();

    const updatedStakes = userStakes.map((stake) => {
      const rewards = get().calculateRewards(stake);
      totalRewards += rewards;
      return { ...stake, lastClaimTime: now, rewards: stake.rewards + rewards };
    });

    if (totalRewards <= 0) {
      return { success: false, amount: 0, message: 'No rewards to claim' };
    }

    set((state) => ({
      wallet: { ...state.wallet, balance: state.wallet.balance + totalRewards },
      userStakes: updatedStakes,
      liquidityPool: {
        ...state.liquidityPool,
        totalRewards: state.liquidityPool.totalRewards + totalRewards,
      },
    }));

    useNotificationStore.getState().addNotification('success', `Claimed ${totalRewards.toFixed(2)} MON rewards`, 'Rewards Claimed');
    return { success: true, amount: totalRewards, message: `Claimed ${totalRewards.toFixed(2)} MON rewards` };
  },

  // ==================== 锦标赛系统实现 ====================

  // 报名锦标赛
  registerForTournament: (tournamentId: string, agentId: string) => {
    const { wallet, tournaments, myAgents, tournamentEntries } = get();

    if (!wallet.connected) {
      return { success: false, message: 'Please connect wallet first' };
    }

    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) {
      return { success: false, message: 'Tournament not found' };
    }

    if (tournament.status !== 'registration' && tournament.status !== 'upcoming') {
      return { success: false, message: 'Registration is closed' };
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      return { success: false, message: 'Tournament is full' };
    }

    // 检查是否已经报名
    const existingEntry = tournamentEntries.find(
      (e) => e.tournamentId === tournamentId && e.userId === wallet.address
    );
    if (existingEntry) {
      return { success: false, message: 'You have already registered for this tournament' };
    }

    const agent = myAgents.find((a) => a.id === agentId);
    if (!agent) {
      return { success: false, message: 'Agent not found' };
    }

    // 检查Agent是否在竞技场中
    const { arena } = get();
    const isInArena = arena.participants.some((p) => p.id === agentId);
    if (isInArena) {
      return { success: false, message: 'Agent is currently in arena. Please remove from arena first.' };
    }

    // 检查钱包余额是否足够支付报名费
    if (wallet.balance < tournament.entryFee) {
      return { success: false, message: `Insufficient wallet balance for entry fee (${tournament.entryFee} MON). Current: ${wallet.balance} MON` };
    }

    // 检查资格赛要求
    if (tournament.type === 'daily') {
      // 日联赛：需要是过去24小时挑战赛冠军
      const recentChampions = get().tournamentHistory
        .filter((h) => h.type === 'challenge' && h.endTime > Date.now() - 24 * 60 * 60 * 1000)
        .map((h) => h.winner.id);
      if (!recentChampions.includes(agentId)) {
        return { success: false, message: 'Only recent challenge champions can register for daily league' };
      }
    } else if (tournament.type === 'weekly') {
      // 周联赛：需要是本周日冠军
      const sundayChampions = get().tournamentHistory
        .filter((h) => {
          const date = new Date(h.endTime);
          return h.type === 'daily' && date.getDay() === 0; // Sunday
        })
        .map((h) => h.winner.id);
      if (!sundayChampions.includes(agentId)) {
        return { success: false, message: 'Only Sunday champions can register for weekly league' };
      }
    }

    // 扣除报名费
    const entry: TournamentEntry = {
      id: Math.random().toString(36).substr(2, 9),
      tournamentId,
      userId: wallet.address,
      agentId,
      agent,
      entryFee: tournament.entryFee,
      registeredAt: Date.now(),
    };

    set((state) => ({
      wallet: { ...state.wallet, balance: state.wallet.balance - tournament.entryFee },
      tournamentEntries: [...state.tournamentEntries, entry],
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, participants: [...t.participants, agent] }
          : t
      ),
    }));

    useNotificationStore.getState().addNotification('success', `Registered ${agent.name} for tournament`, 'Tournament Registration');
    return { success: true, message: 'Successfully registered for tournament' };
  },

  // 设置自动报名
  setTournamentAutoSettings: (settings: Partial<TournamentAutoSettings>) => {
    set((state) => ({
      tournamentAutoSettings: { ...state.tournamentAutoSettings, ...settings },
    }));
  },

  // 执行自动报名
  executeAutoTournamentRegistration: () => {
    const { tournamentAutoSettings, tournaments, myAgents, wallet } = get();

    if (!tournamentAutoSettings.enabled || !wallet.connected) return;

    // 对每种锦标赛类型进行自动报名
    tournaments.forEach((tournament) => {
      if (tournament.status !== 'registration' && tournament.status !== 'upcoming') return;
      if (tournament.participants.length >= tournament.maxParticipants) return;

      const typeSettings = tournamentAutoSettings[tournament.type];
      if (!typeSettings?.enabled) return;

      // 检查钱包余额是否足够
      if (wallet.balance < tournament.entryFee) return;

      // 获取符合条件的Agent（不在竞技场）
      const { arena } = get();
      const eligibleAgents = myAgents.filter(
        (a) => !arena.participants.some((p) => p.id === a.id)
      );

      if (eligibleAgents.length === 0) return;

      // 选择Agent
      let selectedAgent: Agent | undefined;

      if (typeSettings.preferredAgentId) {
        selectedAgent = eligibleAgents.find((a) => a.id === typeSettings.preferredAgentId);
      }

      if (!selectedAgent && typeSettings.autoSelect) {
        selectedAgent = eligibleAgents[0];
      }

      if (selectedAgent) {
        get().registerForTournament(tournament.id, selectedAgent.id);
      }
    });
  },

  // 填充锦标赛系统Agents
  fillTournamentWithSystemAgents: (tournamentId: string) => {
    const { tournaments } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const currentCount = tournament.participants.length;
    const neededCount = tournament.maxParticipants - currentCount;

    if (neededCount <= 0) return;

    // 从预生成的1000个系统Agents中选取
    const systemAgents = TOURNAMENT_SYSTEM_AGENTS.slice(0, neededCount).map((agent, index) => ({
      ...agent,
      id: `sys-${tournamentId}-${index}-${agent.id}`,
    }));

    // 创建系统报名记录
    const systemEntries: TournamentEntry[] = systemAgents.map((agent) => ({
      id: `sys-entry-${tournamentId}-${agent.id}`,
      tournamentId,
      userId: 'system',
      agentId: agent.id,
      agent,
      entryFee: tournament.entryFee,
      registeredAt: Date.now(),
    }));

    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, participants: [...t.participants, ...systemAgents] }
          : t
      ),
      tournamentEntries: [...state.tournamentEntries, ...systemEntries],
    }));
  },

  // 开始锦标赛
  startTournament: (tournamentId: string) => {
    const { tournaments } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    // 先填充系统Agents确保满员
    get().fillTournamentWithSystemAgents(tournamentId);

    // 重新获取更新后的锦标赛数据
    const updatedTournament = get().tournaments.find((t) => t.id === tournamentId);
    if (!updatedTournament) return;

    // 生成对阵表
    const matches: TournamentMatch[] = [];
    const participants = [...updatedTournament.participants];

    // 128进32 (第一轮，128人分成32组，每组4人，取1人)
    for (let i = 0; i < 32; i++) {
      const groupAgents = participants.slice(i * 4, (i + 1) * 4);
      if (groupAgents.length >= 2) {
        matches.push({
          id: `match-${tournamentId}-r128-${i}`,
          tournamentId,
          round: 'round128',
          matchIndex: i,
          agentA: groupAgents[0],
          agentB: groupAgents[1],
        });
      }
    }

    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, status: 'ongoing', currentRound: 'round128', matches }
          : t
      ),
    }));
  },

  // 晋级下一轮
  advanceTournamentRound: (tournamentId: string) => {
    const { tournaments } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const currentMatches = tournament.matches.filter((m) => m.round === tournament.currentRound);
    const winners = currentMatches.map((m) => m.winnerId).filter(Boolean) as string[];

    // 根据当前轮次决定下一轮
    let nextRound: TournamentRound;
    let matches: TournamentMatch[] = [];

    switch (tournament.currentRound) {
      case 'round128':
        nextRound = 'round32';
        // 32进8 (32人分成8组，每组4人)
        for (let i = 0; i < 8; i++) {
          const groupWinners = winners.slice(i * 4, (i + 1) * 4);
          if (groupWinners.length >= 2) {
            const agentA = tournament.participants.find((a) => a.id === groupWinners[0]);
            const agentB = tournament.participants.find((a) => a.id === groupWinners[1]);
            if (agentA && agentB) {
              matches.push({
                id: `match-${tournamentId}-r32-${i}`,
                tournamentId,
                round: 'round32',
                matchIndex: i,
                agentA,
                agentB,
              });
            }
          }
        }
        break;
      case 'round32':
        nextRound = 'round8';
        // 8进4
        for (let i = 0; i < 4; i++) {
          const matchWinners = winners.slice(i * 2, (i + 1) * 2);
          if (matchWinners.length >= 2) {
            const agentA = tournament.participants.find((a) => a.id === matchWinners[0]);
            const agentB = tournament.participants.find((a) => a.id === matchWinners[1]);
            if (agentA && agentB) {
              matches.push({
                id: `match-${tournamentId}-r8-${i}`,
                tournamentId,
                round: 'round8',
                matchIndex: i,
                agentA,
                agentB,
              });
            }
          }
        }
        break;
      case 'round8':
        nextRound = 'semifinal';
        // 半决赛
        for (let i = 0; i < 2; i++) {
          const matchWinners = winners.slice(i * 2, (i + 1) * 2);
          if (matchWinners.length >= 2) {
            const agentA = tournament.participants.find((a) => a.id === matchWinners[0]);
            const agentB = tournament.participants.find((a) => a.id === matchWinners[1]);
            if (agentA && agentB) {
              matches.push({
                id: `match-${tournamentId}-sf-${i}`,
                tournamentId,
                round: 'semifinal',
                matchIndex: i,
                agentA,
                agentB,
              });
            }
          }
        }
        break;
      case 'semifinal':
        nextRound = 'final';
        // 决赛
        if (winners.length >= 2) {
          const agentA = tournament.participants.find((a) => a.id === winners[0]);
          const agentB = tournament.participants.find((a) => a.id === winners[1]);
          if (agentA && agentB) {
            matches.push({
              id: `match-${tournamentId}-final`,
              tournamentId,
              round: 'final',
              matchIndex: 0,
              agentA,
              agentB,
            });
          }
        }
        break;
      case 'final':
        // 锦标赛结束
        const championId = winners[0];
        const champion = tournament.participants.find((a) => a.id === championId);
        if (champion) {
          // 发放奖金
          const prizePool = tournament.prizePool;
          const championPrize = prizePool * 0.5; // 冠军50%
          // const runnerUpPrize = prizePool * 0.3; // 亚军30%
          // const thirdPlacePrize = prizePool * 0.2; // 季军20%

          // 记录历史
          const history: TournamentHistory = {
            tournamentId,
            type: tournament.type,
            name: tournament.name,
            startTime: tournament.startTime,
            endTime: Date.now(),
            totalParticipants: tournament.participants.length,
            winner: champion,
            prizePool,
            matches: tournament.matches,
          };

          set((state) => ({
            tournamentHistory: [...state.tournamentHistory, history],
            tournaments: state.tournaments.map((t) =>
              t.id === tournamentId
                ? {
                    ...t,
                    status: 'finished',
                    winners: [
                      { agent: champion, prize: championPrize, rank: 1 },
                      // 添加亚军和季军...
                    ],
                  }
                : t
            ),
          }));
        }
        return;
    }

    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              currentRound: nextRound,
              matches: [...t.matches, ...matches],
              qualifiedAgents: tournament.participants.filter((a) => winners.includes(a.id)),
            }
          : t
      ),
    }));
  },

  // 获取有资格报名的Agent
  getQualifiedAgentsForTournament: (tournamentId: string) => {
    const { tournaments, myAgents, tournamentHistory, arena, wallet } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return [];

    // 基础条件：不在竞技场且钱包余额足够支付报名费
    let qualified = myAgents.filter(
      (a) => !arena.participants.some((p) => p.id === a.id) && wallet.balance >= tournament.entryFee
    );

    // 根据类型添加额外条件
    if (tournament.type === 'daily') {
      const recentChampions = tournamentHistory
        .filter((h) => h.type === 'challenge' && h.endTime > Date.now() - 24 * 60 * 60 * 1000)
        .map((h) => h.winner.id);
      qualified = qualified.filter((a) => recentChampions.includes(a.id));
    } else if (tournament.type === 'weekly') {
      const sundayChampions = tournamentHistory
        .filter((h) => {
          const date = new Date(h.endTime);
          return h.type === 'daily' && date.getDay() === 0;
        })
        .map((h) => h.winner.id);
      qualified = qualified.filter((a) => sundayChampions.includes(a.id));
    }

    return qualified;
  },

  // ==================== 快速锦标赛模拟系统 ====================

  // 模拟单场比赛并返回获胜者
  simulateMatch: (agentA: Agent, agentB: Agent): Agent => {
    // 计算胜率（基于攻击+防御+随机因素）
    const powerA = agentA.attack + agentA.defense + Math.random() * 20;
    const powerB = agentB.attack + agentB.defense + Math.random() * 20;
    return powerA > powerB ? agentA : agentB;
  },

  // 快速执行当前轮次的所有比赛
  executeCurrentRound: (tournamentId: string) => {
    const { tournaments } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.status !== 'ongoing') return;

    const currentMatches = tournament.matches.filter((m) => m.round === tournament.currentRound);

    // 模拟每场比赛
    const updatedMatches = currentMatches.map((match) => {
      if (match.winnerId || !match.agentA || !match.agentB) return match;

      const winner = get().simulateMatch(match.agentA, match.agentB);
      return {
        ...match,
        winnerId: winner.id,
        endTime: Date.now(),
      };
    });

    // 更新比赛结果
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              matches: t.matches.map((m) =>
                updatedMatches.find((um) => um.id === m.id) || m
              ),
            }
          : t
      ),
    }));
  },

  // 快速完成整个锦标赛（90秒内）
  runFastTournament: async (tournamentId: string) => {
    const tournament = get().tournaments.find((t) => t.id === tournamentId);
    if (!tournament || tournament.type !== 'challenge') return;

    // 轮次时间安排（总计90秒）
    const roundTiming = {
      round128: 0,      // 立即开始
      round32: 15000,   // 15秒后开始32强
      round8: 35000,    // 35秒后开始8强
      semifinal: 55000, // 55秒后开始半决赛
      final: 75000,     // 75秒后开始决赛
    };

    // 执行128强
    get().executeCurrentRound(tournamentId);

    // 按时间线执行各轮次
    Object.entries(roundTiming).forEach(([round, delay]) => {
      setTimeout(() => {
        // 晋级到下一轮
        get().advanceTournamentRound(tournamentId);

        // 如果是决赛，不需要再执行比赛（advanceTournamentRound会处理结束逻辑）
        if (round !== 'final') {
          // 短暂延迟后执行当前轮次的比赛
          setTimeout(() => {
            get().executeCurrentRound(tournamentId);
          }, 1000);
        }
      }, delay);
    });
  },

  // 创建新的挑战赛
  createChallengeTournament: () => {
    const id = `challenge-${Date.now()}`;
    const newTournament: Tournament = {
      id,
      name: `Challenge Arena #${get().tournaments.filter((t) => t.type === 'challenge').length + 1}`,
      type: 'challenge',
      status: 'registration',
      prizePool: 5000,
      participants: [],
      maxParticipants: 128,
      startTime: Date.now() + 60000, // 1分钟后开始
      entryFee: 100,
      currentRound: 'round128',
      matches: [],
      qualifiedAgents: [],
    };

    set((state) => ({
      tournaments: [...state.tournaments, newTournament],
    }));

    return id;
  },

  // 启动锦标赛定时器系统
  startTournamentScheduler: () => {
    // 每分钟创建一个新的挑战赛
    setInterval(() => {
      const { tournaments } = get();

      // 检查是否有正在报名或即将开始的挑战赛
      const activeChallenges = tournaments.filter(
        (t) => t.type === 'challenge' && (t.status === 'registration' || t.status === 'upcoming')
      );

      // 如果没有活跃的挑战赛，创建一个新的
      if (activeChallenges.length === 0) {
        const newTournamentId = get().createChallengeTournament();

        // 55秒后开始锦标赛（给玩家5秒报名时间）
        setTimeout(() => {
          get().startTournament(newTournamentId);

          // 开始快速锦标赛流程
          setTimeout(() => {
            get().runFastTournament(newTournamentId);
          }, 1000);
        }, 55000);
      }
    }, 60000); // 每分钟检查一次

    // 初始化第一个挑战赛
    const firstChallengeId = get().createChallengeTournament();
    setTimeout(() => {
      get().startTournament(firstChallengeId);
      setTimeout(() => {
        get().runFastTournament(firstChallengeId);
      }, 1000);
    }, 55000);
  },

  // ==================== 后台自动战斗系统 ====================
  autoBattleInterval: null,

  // ==================== 平台收入 ====================
  platformRevenue: 0,

  addPlatformRevenue: (amount: number) => {
    // 将50%手续费分配给流动性池，50%留存为平台收入
    const lpShare = amount * 0.5;
    const platformShare = amount * 0.5;
    
    set((state) => ({
      platformRevenue: state.platformRevenue + platformShare,
      liquidityPool: {
        ...state.liquidityPool,
        feeRevenuePool: state.liquidityPool.feeRevenuePool + lpShare,
        totalFeeDistributed: state.liquidityPool.totalFeeDistributed + lpShare,
      },
    }));
    console.log(`[Platform Revenue] Added ${amount.toFixed(2)} MON (LP: ${lpShare.toFixed(2)}, Platform: ${platformShare.toFixed(2)}), Total Platform: ${(get().platformRevenue + platformShare).toFixed(2)} MON`);
  },

  startAutoBattleSystem: () => {
    const state = get();
    if (state.autoBattleInterval) return; // 已经在运行

    // 每5秒执行一次自动战斗
    const interval = window.setInterval(() => {
      get().simulateAutoBattle();
    }, 5000);

    set({ autoBattleInterval: interval });
    console.log('[AutoBattle] 系统自动战斗已启动');
  },

  stopAutoBattleSystem: () => {
    const state = get();
    if (state.autoBattleInterval) {
      clearInterval(state.autoBattleInterval);
      set({ autoBattleInterval: null });
      console.log('[AutoBattle] 系统自动战斗已停止');
    }
  },

  simulateAutoBattle: () => {
    const state = get();
    const { systemAgents, myAgents } = state;

    // 获取所有在竞技场中的agents（只选择in_arena状态的，避免与Canvas视觉战斗冲突）
    const allArenaAgents = [
      ...myAgents.filter(a => a.status === 'in_arena'),
      ...systemAgents.filter(a => a.status === 'in_arena'),
    ];

    console.log('[AutoBattle] 检查战斗条件:', {
      myAgentsCount: myAgents.length,
      myAgentsInArena: myAgents.filter(a => a.status === 'in_arena').length,
      systemAgentsCount: systemAgents.length,
      systemAgentsInArena: systemAgents.filter(a => a.status === 'in_arena').length,
      totalArenaAgents: allArenaAgents.length,
    });

    if (allArenaAgents.length < 2) {
      console.log('[AutoBattle] 跳过战斗: 参与者不足 (< 2)');
      return; // 没有足够的参与者
    }

    // 随机选择10个agents进行一场战斗
    const shuffled = [...allArenaAgents].sort(() => Math.random() - 0.5);
    const selectedAgents = shuffled.slice(0, Math.min(10, shuffled.length));

    // 记录每个agent的初始余额（深拷贝）
    const initialBalances = new Map<string, number>();
    selectedAgents.forEach(agent => {
      initialBalances.set(agent.id, agent.balance);
    });

    // 创建战斗用的agent副本（避免直接修改原始对象）
    let battleAgents = selectedAgents.map(agent => ({ ...agent }));
    const battleRecords: any[] = [];

    // 进行多轮攻击直到只剩1个或全部死亡
    let round = 0;
    const maxRounds = 20;

    while (battleAgents.length > 1 && round < maxRounds) {
      round++;

      // 随机选择攻击者和目标
      const attackerIndex = Math.floor(Math.random() * battleAgents.length);
      let targetIndex = Math.floor(Math.random() * battleAgents.length);
      while (targetIndex === attackerIndex) {
        targetIndex = Math.floor(Math.random() * battleAgents.length);
      }

      const attacker = battleAgents[attackerIndex];
      const target = battleAgents[targetIndex];

      // 计算伤害
      const isCrit = Math.random() > 0.8;
      // 基础伤害 = (攻击力 - 防御力) * 倍率 + 随机值
      // 倍率设置为5，让掠夺金额更合理（原来只有1倍，导致伤害只有1-15）
      const damageMultiplier = 5;
      const baseDamage = (attacker.attack - target.defense) * damageMultiplier + Math.floor(Math.random() * 50);
      const damage = Math.max(10, isCrit ? Math.floor(baseDamage * 1.5) : baseDamage);

      // 掠夺资金（不能超过目标的余额）
      const lootAmount = Math.min(damage, target.balance);
      const newTargetBalance = Math.max(0, target.balance - lootAmount);
      const newAttackerBalance = attacker.balance + lootAmount;

      // 记录战斗
      battleRecords.push({
        round,
        attackerId: attacker.id,
        attackerName: attacker.name,
        targetId: target.id,
        targetName: target.name,
        damage: lootAmount,
        isCrit,
        timestamp: Date.now(),
      });

      // 更新战斗中的agents状态
      attacker.balance = newAttackerBalance;
      target.balance = newTargetBalance;

      // 检查目标是否死亡
      if (newTargetBalance <= 0) {
        battleAgents = battleAgents.filter(a => a.id !== target.id);
      }
    }

    // 确定胜者
    const winner = battleAgents.length > 0
      ? battleAgents.sort((a, b) => b.balance - a.balance)[0]
      : null;

    // 计算并从赢家盈利中抽取2%平台手续费（在更新统计前执行）
    let platformFee = 0;
    let netLoot = 0;
    if (winner) {
      const winnerInitialBalance = initialBalances.get(winner.id) || 0;
      const winnerFinalBalance = winner.balance;
      const totalLoot = winnerFinalBalance - winnerInitialBalance;

      if (totalLoot > 0) {
        platformFee = Math.floor(totalLoot * 0.02); // 2%手续费
        winner.balance -= platformFee;
        netLoot = totalLoot - platformFee;
        get().addPlatformRevenue(platformFee);
      }
    }

    // 更新所有参与者的战斗统计到store
    selectedAgents.forEach(originalAgent => {
      const battleAgent = battleAgents.find(a => a.id === originalAgent.id) ||
                         { ...originalAgent, balance: 0 }; // 如果不在存活列表中，说明已死亡
      const isWinner = winner && originalAgent.id === winner.id;
      const survived = battleAgent.balance > 0;
      const initialBalance = initialBalances.get(originalAgent.id) || 0;
      const profit = battleAgent.balance - initialBalance;

      // 更新战斗统计
      const newTotalBattles = originalAgent.totalBattles + 1;
      const newWins = isWinner ? originalAgent.wins + 1 : originalAgent.wins;
      const newLosses = survived && !isWinner ? originalAgent.losses : originalAgent.losses + 1;
      const newWinRate = Math.round((newWins / newTotalBattles) * 100);
      const newNetProfit = originalAgent.netProfit + profit;

      // 添加战斗记录
      const battleRecord = {
        id: `autobattle-${Date.now()}-${originalAgent.id}`,
        timestamp: Date.now(),
        opponent: winner ? winner.name : 'Multiple Opponents',
        result: isWinner ? 'win' : (survived ? 'draw' : 'loss') as 'win' | 'loss',
        damageDealt: profit > 0 ? profit : 0,
        damageTaken: profit < 0 ? Math.abs(profit) : 0,
        earnings: profit,
        kills: isWinner ? 1 : 0,
        isTournament: false,
      };

      // 根据余额确定最终状态：有余额则保持在竞技场，余额为0则被淘汰
      const finalStatus = battleAgent.balance > 0 ? 'in_arena' : 'eliminated';

      // 更新agent到store
      set((state) => ({
        myAgents: state.myAgents.map(a =>
          a.id === originalAgent.id
            ? {
                ...a,
                balance: battleAgent.balance,
                totalBattles: newTotalBattles,
                wins: newWins,
                losses: newLosses,
                winRate: newWinRate,
                netProfit: newNetProfit,
                battleHistory: [battleRecord, ...a.battleHistory].slice(0, 50),
                status: finalStatus as 'in_arena' | 'eliminated',
              }
            : a
        ),
        systemAgents: state.systemAgents.map(a =>
          a.id === originalAgent.id
            ? {
                ...a,
                balance: battleAgent.balance,
                totalBattles: newTotalBattles,
                wins: newWins,
                losses: newLosses,
                winRate: newWinRate,
                netProfit: newNetProfit,
                battleHistory: [battleRecord, ...a.battleHistory].slice(0, 50),
                status: finalStatus as 'in_arena' | 'eliminated',
              }
            : a
        ),
      }));
    });

    // 添加战斗日志
    if (winner) {
      const log: BattleLog = {
        id: `autobattle-${Date.now()}`,
        timestamp: Date.now(),
        type: 'eliminate',
        attacker: winner,
        defender: selectedAgents.find(p => p.id !== winner.id) || selectedAgents[0],
        message: netLoot > 0
          ? `[AutoBattle] ${winner.name} 赢得了战斗！掠夺 ${Math.floor(netLoot)} $MON${platformFee > 0 ? ` (手续费 ${platformFee} MON)` : ''}`
          : `[AutoBattle] ${winner.name} 赢得了战斗！`,
        isHighlight: true,
      };

      set((state) => ({
        // 添加到我的战斗日志
        myBattleLogs: [log, ...state.myBattleLogs].slice(0, 50),
        // 同时添加到竞技场战斗日志，让所有战斗日志都显示在竞技场
        arena: {
          ...state.arena,
          battleLogs: [log, ...state.arena.battleLogs].slice(0, 100),
        },
      }));
    }

    // 增加总轮次
    set((state) => {
      const newRounds = state.totalSystemRounds + 1;
      console.log('[AutoBattle] 战斗完成，轮次增加到:', newRounds);
      return { totalSystemRounds: newRounds };
    });
    
    // 重新计算 lockedBalance（因为 Agents 余额可能变化）
    set((state) => {
      const newLockedBalance = state.myAgents.reduce((sum, a) => sum + a.balance, 0);
      return {
        wallet: {
          ...state.wallet,
          lockedBalance: newLockedBalance,
        }
      };
    });
  },

  getRandomAgentBattleHistory: (agentId: string) => {
    const state = get();
    const agent = state.myAgents.find(a => a.id === agentId) ||
                  state.systemAgents.find(a => a.id === agentId);

    if (!agent || agent.battleHistory.length === 0) {
      return null;
    }

    // 随机选择一场战斗
    const randomBattle = agent.battleHistory[Math.floor(Math.random() * agent.battleHistory.length)];

    // 找到对手
    const opponentName = randomBattle.opponent;
    const opponent = state.systemAgents.find(a => a.name === opponentName) ||
                    state.myAgents.find(a => a.name === opponentName);

    return {
      battle: randomBattle,
      opponent: opponent || null,
      result: randomBattle.result,
      profit: randomBattle.earnings,
    };
  },
}), {
  name: 'aibrawl-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    wallet: state.wallet,
    myAgents: state.myAgents,
    userStakes: state.userStakes,
    systemAgents: state.systemAgents,
    totalSystemRounds: state.totalSystemRounds,
    liquidityPool: state.liquidityPool,
    platformRevenue: state.platformRevenue,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return;
    // 数据迁移：将旧的'dead'状态改为'eliminated'
    if (state.myAgents) {
      state.myAgents = state.myAgents.map(agent => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((agent.status as any) === 'dead') {
          return { ...agent, status: 'eliminated' };
        }
        return agent;
      });
    }
    // 确保userStakes是数组
    if (!state.userStakes) {
      state.userStakes = [];
    }
    // 确保systemAgents是数组
    if (!state.systemAgents) {
      state.systemAgents = [];
    }
    // 确保totalSystemRounds是数字
    if (typeof state.totalSystemRounds !== 'number') {
      state.totalSystemRounds = 0;
    }
  },
}));
