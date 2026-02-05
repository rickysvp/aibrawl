import { create } from 'zustand';
import {
  Agent, BattleLog, ArenaState, WalletState, Tournament, RoundPhase,
  LiquidityPool, LiquidityStake, PredictionMarket, PredictionBet, AutoBetRule,
  TournamentType, TournamentStatus, TournamentRound, TournamentEntry, TournamentMatch,
  TournamentAutoSettings, TournamentHistory
} from '../types';
import { generateRandomAgent, generateSystemAgents, TOURNAMENT_SYSTEM_AGENTS } from '../utils/agentGenerator';

interface GameStore {
  // 钱包状态
  wallet: WalletState;
  connectWallet: (type?: 'twitter' | 'google' | 'wallet') => void;
  disconnectWallet: () => void;

  // 玩家的 Agents
  myAgents: Agent[];
  mintAgent: () => Agent | null;
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
  stakeLiquidity: (amount: number) => { success: boolean; message: string };
  unstakeLiquidity: (stakeId: string) => { success: boolean; message: string };
  claimLiquidityRewards: () => { success: boolean; amount: number; message: string };
  calculateRewards: (stake: LiquidityStake) => number;
  getDynamicAPR: () => number;

  // ==================== 预测市场 ====================
  predictionMarkets: PredictionMarket[];
  userPredictions: PredictionBet[];
  autoBetRule: AutoBetRule;
  placePredictionBet: (marketId: string, agentId: string, amount: number, betType: 'semifinal' | 'final' | 'match') => { success: boolean; message: string };
  settlePredictionMarket: (marketId: string, winnerId: string) => void;
  updateOdds: (marketId: string) => void;
  setAutoBetRule: (rule: Partial<AutoBetRule>) => void;
  executeAutoBet: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
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

  connectWallet: (type: 'twitter' | 'google' | 'wallet' = 'wallet') => {
    const randomAddress = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // 生成昵称和头像
    let nickname = '';
    let avatar = '';

    if (type === 'twitter') {
      const twitterNames = ['CryptoWhale', 'MoonHunter', 'AlphaTrader', 'DeFiKing', 'NFTCollector'];
      nickname = twitterNames[Math.floor(Math.random() * twitterNames.length)];
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAddress}&backgroundColor=1da1f2`;
    } else if (type === 'google') {
      const googleNames = ['DiamondHands', 'TokenMaster', 'BlockChainer', 'Web3Explorer', 'ChainSurfer'];
      nickname = googleNames[Math.floor(Math.random() * googleNames.length)];
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAddress}&backgroundColor=4285f4`;
    } else {
      // 钱包登录 - 使用后6位作为昵称，分配默认头像
      nickname = randomAddress.slice(-6).toUpperCase();
      avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${randomAddress}&backgroundColor=b6e3f4`;
    }

    set({
      wallet: {
        connected: true,
        address: randomAddress,
        balance: 10000,
        lockedBalance: 0,
        loginType: type,
        nickname,
        avatar,
      }
    });
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
  
  mintAgent: () => {
    const { wallet, mintCost } = get();
    if (!wallet.connected || wallet.balance < mintCost) return null;
    
    const newAgent = generateRandomAgent(true);
    set((state) => ({
      wallet: { ...state.wallet, balance: state.wallet.balance - mintCost },
      myAgents: [...state.myAgents, newAgent],
    }));
    return newAgent;
  },
  
  allocateFunds: (agentId: string, amount: number) => {
    const { wallet } = get();
    if (wallet.balance < amount) return;
    
    set((state) => ({
      wallet: { 
        ...state.wallet, 
        balance: state.wallet.balance - amount,
        lockedBalance: state.wallet.lockedBalance + amount,
      },
      myAgents: state.myAgents.map(a => 
        a.id === agentId ? { ...a, balance: a.balance + amount } : a
      ),
    }));
  },
  
  withdrawFunds: (agentId: string, amount: number) => {
    const agent = get().myAgents.find(a => a.id === agentId);
    if (!agent || agent.balance < amount || agent.status !== 'idle') return;
    
    set((state) => ({
      wallet: { 
        ...state.wallet, 
        balance: state.wallet.balance + amount,
        lockedBalance: state.wallet.lockedBalance - amount,
      },
      myAgents: state.myAgents.map(a => 
        a.id === agentId ? { ...a, balance: a.balance - amount } : a
      ),
    }));
  },
  
  joinArena: (agentId: string) => {
    const agent = get().myAgents.find(a => a.id === agentId);
    if (!agent || agent.status !== 'idle' || agent.balance <= 0) return;
    
    set((state) => ({
      myAgents: state.myAgents.map(a => 
        a.id === agentId ? { ...a, status: 'in_arena' } : a
      ),
    }));
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
  
  initializeArena: () => {
    const systemAgents = generateSystemAgents(1000);
    set({ systemAgents });
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
    set((state) => ({
      arena: {
        ...state.arena,
        participants: state.arena.participants.map(a =>
          a.id === agentId ? { ...a, ...updates } : a
        ),
      },
      myAgents: state.myAgents.map(a =>
        a.id === agentId ? { ...a, ...updates } : a
      ),
      systemAgents: state.systemAgents.map(a =>
        a.id === agentId ? { ...a, ...updates } : a
      ),
    }));
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

  // ==================== 流动性挖矿实现 ====================
  liquidityPool: {
    totalStaked: 500000,
    totalRewards: 25000,
    apr: 25,
    rewardRate: 25 / (365 * 24 * 60 * 60 * 100), // 每秒奖励率
    stakerCount: 128,
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
    const elapsedSeconds = (now - stake.lastClaimTime) / 1000;
    const { liquidityPool } = get();
    return stake.amount * liquidityPool.rewardRate * elapsedSeconds;
  },

  stakeLiquidity: (amount: number) => {
    const { wallet, liquidityPool, userStakes } = get();

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
    const newStake: LiquidityStake = {
      id: Math.random().toString(36).substr(2, 9),
      userId: wallet.address,
      amount,
      stakedAt: now,
      rewards: 0,
      unlockTime: now + 7 * 24 * 60 * 60 * 1000, // 7天锁仓
      lastClaimTime: now,
    };

    set((state) => ({
      wallet: { ...state.wallet, balance: state.wallet.balance - amount },
      liquidityPool: {
        ...state.liquidityPool,
        totalStaked: state.liquidityPool.totalStaked + amount,
        stakerCount: state.userStakes.length + 1,
        apr: get().getDynamicAPR(),
      },
      userStakes: [...state.userStakes, newStake],
    }));

    return { success: true, message: 'Staked successfully' };
  },

  unstakeLiquidity: (stakeId: string) => {
    const { wallet, userStakes, liquidityPool } = get();
    const stake = userStakes.find((s) => s.id === stakeId);

    if (!stake) {
      return { success: false, message: 'Stake not found' };
    }

    const now = Date.now();
    const isEarly = now < stake.unlockTime;
    const penalty = isEarly ? stake.amount * 0.2 : 0; // 提前解质押扣20%
    const returnAmount = stake.amount - penalty;
    const pendingRewards = get().calculateRewards(stake);

    set((state) => ({
      wallet: {
        ...state.wallet,
        balance: state.wallet.balance + returnAmount + pendingRewards,
      },
      liquidityPool: {
        ...state.liquidityPool,
        totalStaked: state.liquidityPool.totalStaked - stake.amount,
        stakerCount: Math.max(0, state.userStakes.length - 1),
      },
      userStakes: state.userStakes.filter((s) => s.id !== stakeId),
    }));

    return {
      success: true,
      message: isEarly
        ? `Unstaked with 20% early withdrawal penalty. Received ${returnAmount.toFixed(2)} MON + ${pendingRewards.toFixed(2)} rewards`
        : `Unstaked successfully. Received ${returnAmount.toFixed(2)} MON + ${pendingRewards.toFixed(2)} rewards`,
    };
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

    return { success: true, amount: totalRewards, message: `Claimed ${totalRewards.toFixed(2)} MON rewards` };
  },

  // ==================== 预测市场实现 ====================
  predictionMarkets: [
    {
      id: 'market-1',
      tournamentId: '1',
      name: 'Champion Prediction',
      totalPool: 5000,
      odds: {},
      status: 'open',
      deadline: Date.now() + 86400000,
      betType: 'final',
      participants: [],
    },
  ],
  userPredictions: [],
  autoBetRule: {
    enabled: false,
    betAmount: 100,
    strategy: 'always',
    maxBetsPerDay: 5,
  },

  placePredictionBet: (marketId: string, agentId: string, amount: number, betType: 'semifinal' | 'final' | 'match') => {
    const { wallet, predictionMarkets, userPredictions } = get();

    if (!wallet.connected) {
      return { success: false, message: 'Please connect wallet first' };
    }

    if (wallet.balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    const market = predictionMarkets.find((m) => m.id === marketId);
    if (!market || market.status !== 'open') {
      return { success: false, message: 'Market is not open' };
    }

    if (Date.now() > market.deadline) {
      return { success: false, message: 'Market deadline has passed' };
    }

    if (amount < 10) {
      return { success: false, message: 'Minimum bet is 10 MON' };
    }

    // 计算赔率
    const currentOdds = market.odds[agentId] || 2.0;
    const potentialWin = amount * currentOdds;

    const newBet: PredictionBet = {
      id: Math.random().toString(36).substr(2, 9),
      userId: wallet.address,
      marketId,
      tournamentId: market.tournamentId,
      predictedAgentId: agentId,
      betAmount: amount,
      betType,
      odds: currentOdds,
      status: 'pending',
      potentialWin,
      createdAt: Date.now(),
    };

    set((state) => ({
      wallet: { ...state.wallet, balance: state.wallet.balance - amount },
      predictionMarkets: state.predictionMarkets.map((m) =>
        m.id === marketId ? { ...m, totalPool: m.totalPool + amount } : m
      ),
      userPredictions: [...state.userPredictions, newBet],
    }));

    // 更新赔率
    get().updateOdds(marketId);

    return { success: true, message: `Bet placed successfully. Potential win: ${potentialWin.toFixed(2)} MON` };
  },

  updateOdds: (marketId: string) => {
    const { predictionMarkets, userPredictions } = get();
    const market = predictionMarkets.find((m) => m.id === marketId);
    if (!market) return;

    const marketBets = userPredictions.filter((b) => b.marketId === marketId);
    const totalPool = marketBets.reduce((sum, b) => sum + b.betAmount, 0);

    // 计算每个选手的下注总额
    const agentBets: Record<string, number> = {};
    marketBets.forEach((bet) => {
      agentBets[bet.predictedAgentId] = (agentBets[bet.predictedAgentId] || 0) + bet.betAmount;
    });

    // 动态赔率计算
    const newOdds: Record<string, number> = {};
    market.participants.forEach((agentId) => {
      const agentBet = agentBets[agentId] || 0;
      if (agentBet > 0) {
        // 赔率 = 总池 / 该选手下注额 * 0.95 (5%平台费)
        newOdds[agentId] = (totalPool / agentBet) * 0.95;
      } else {
        // 无人下注时默认赔率
        newOdds[agentId] = market.betType === 'final' ? 3.0 : market.betType === 'semifinal' ? 2.0 : 1.8;
      }
    });

    set((state) => ({
      predictionMarkets: state.predictionMarkets.map((m) =>
        m.id === marketId ? { ...m, odds: newOdds } : m
      ),
    }));
  },

  settlePredictionMarket: (marketId: string, winnerId: string) => {
    const { userPredictions } = get();

    const updatedPredictions = userPredictions.map((bet) => {
      if (bet.marketId === marketId) {
        const won = bet.predictedAgentId === winnerId;
        return { ...bet, status: won ? 'won' : 'lost' };
      }
      return bet;
    });

    // 发放奖励
    const winningBets = updatedPredictions.filter(
      (b) => b.marketId === marketId && b.status === 'won'
    );

    let totalPayout = 0;
    winningBets.forEach((bet) => {
      totalPayout += bet.potentialWin;
    });

    set((state) => ({
      userPredictions: updatedPredictions,
      predictionMarkets: state.predictionMarkets.map((m) =>
        m.id === marketId ? { ...m, status: 'settled' } : m
      ),
    }));

    // 给获胜者发放奖励
    winningBets.forEach((bet) => {
      if (bet.userId === get().wallet.address) {
        set((state) => ({
          wallet: { ...state.wallet, balance: state.wallet.balance + bet.potentialWin },
        }));
      }
    });
  },

  setAutoBetRule: (rule: Partial<AutoBetRule>) => {
    set((state) => ({
      autoBetRule: { ...state.autoBetRule, ...rule },
    }));
  },

  executeAutoBet: () => {
    const { autoBetRule, predictionMarkets, wallet } = get();

    if (!autoBetRule.enabled || !wallet.connected) return;

    // 获取今日已下注次数
    const todayBets = get().userPredictions.filter(
      (b) => b.userId === wallet.address && b.createdAt > Date.now() - 86400000
    ).length;

    if (todayBets >= autoBetRule.maxBetsPerDay) return;

    // 找到开放的市场
    const openMarkets = predictionMarkets.filter((m) => m.status === 'open');
    if (openMarkets.length === 0) return;

    const market = openMarkets[0];

    // 根据策略选择选手
    let selectedAgentId = '';

    if (autoBetRule.strategy === 'specified' && autoBetRule.specifiedAgentIds?.length) {
      selectedAgentId = autoBetRule.specifiedAgentIds[0];
    } else {
      // 默认选择第一个参与者或随机选择
      selectedAgentId = market.participants[0] || '';
    }

    if (selectedAgentId) {
      get().placePredictionBet(market.id, selectedAgentId, autoBetRule.betAmount, market.betType);
    }
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

    // 检查余额
    if (agent.balance < 100) {
      return { success: false, message: 'Agent balance must be at least 100 MON' };
    }

    // 检查报名费
    if (wallet.balance < tournament.entryFee) {
      return { success: false, message: `Insufficient balance for entry fee (${tournament.entryFee} MON)` };
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

    // 获取符合条件的Agent（不在竞技场且余额>100）
    const { arena } = get();
    const eligibleAgents = myAgents.filter(
      (a) => !arena.participants.some((p) => p.id === a.id) && a.balance >= 100
    );

    if (eligibleAgents.length === 0) return;

    // 对每种锦标赛类型进行自动报名
    tournaments.forEach((tournament) => {
      if (tournament.status !== 'registration' && tournament.status !== 'upcoming') return;
      if (tournament.participants.length >= tournament.maxParticipants) return;

      const typeSettings = tournamentAutoSettings[tournament.type];
      if (!typeSettings?.enabled) return;

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
        // 8进4时创建预测市场
        get().createPredictionMarketForTournament(tournamentId, 'semifinal');
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
        // 半决赛时创建冠军预测市场
        get().createPredictionMarketForTournament(tournamentId, 'final');
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
          const runnerUpPrize = prizePool * 0.3; // 亚军30%
          const thirdPlacePrize = prizePool * 0.2; // 季军20%

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
    const { tournaments, myAgents, tournamentHistory, arena } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return [];

    // 基础条件：不在竞技场且余额>100
    let qualified = myAgents.filter(
      (a) => !arena.participants.some((p) => p.id === a.id) && a.balance >= 100
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

  // 为锦标赛创建预测市场
  createPredictionMarketForTournament: (tournamentId: string, betType: 'semifinal' | 'final') => {
    const { tournaments, predictionMarkets } = get();
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const qualifiedAgents = tournament.qualifiedAgents;
    if (qualifiedAgents.length === 0) return;

    const market: PredictionMarket = {
      id: `market-${tournamentId}-${betType}`,
      tournamentId,
      name: betType === 'semifinal' ? 'Semifinal Prediction' : 'Champion Prediction',
      totalPool: 0,
      odds: {},
      status: 'open',
      deadline: Date.now() + 3600000, // 1小时后截止
      betType,
      participants: qualifiedAgents.map((a) => a.id),
    };

    // 初始化赔率
    qualifiedAgents.forEach((agent) => {
      market.odds[agent.id] = betType === 'semifinal' ? 2.0 : 3.0;
    });

    set((state) => ({
      predictionMarkets: [...state.predictionMarkets, market],
    }));
  },
}));
