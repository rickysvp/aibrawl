import { create } from 'zustand';
import { Agent, BattleLog, ArenaState, WalletState, Tournament, RoundPhase } from '../types';
import { generateRandomAgent, generateSystemAgents } from '../utils/agentGenerator';

interface GameStore {
  // 钱包状态
  wallet: WalletState;
  connectWallet: () => void;
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

  // 铸造费用
  mintCost: number;

  // 系统全局轮次计数（所有并行竞技场总和）
  totalSystemRounds: number;
  incrementSystemRound: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 钱包初始状态
  wallet: {
    connected: false,
    address: '',
    balance: 10000,
    lockedBalance: 0,
  },
  
  connectWallet: () => {
    const randomAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    set({
      wallet: {
        connected: true,
        address: randomAddress,
        balance: 10000,
        lockedBalance: 0,
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
      id: '1',
      name: '新手杯',
      status: 'ongoing',
      prizePool: 10000,
      participants: 45,
      maxParticipants: 64,
      startTime: Date.now() - 3600000,
      entryFee: 50,
    },
    {
      id: '2',
      name: '精英挑战赛',
      status: 'upcoming',
      prizePool: 50000,
      participants: 12,
      maxParticipants: 32,
      startTime: Date.now() + 7200000,
      entryFee: 200,
    },
    {
      id: '3',
      name: '周末大乱斗',
      status: 'finished',
      prizePool: 100000,
      participants: 128,
      maxParticipants: 128,
      startTime: Date.now() - 86400000,
      endTime: Date.now() - 43200000,
      entryFee: 100,
      winners: [],
    },
  ],

  // 系统全局轮次计数（所有并行竞技场总和）
  totalSystemRounds: 12580, // 初始值，表示系统已经运行了很多轮

  incrementSystemRound: () => {
    set((state) => ({
      totalSystemRounds: state.totalSystemRounds + 1,
    }));
  },
}));
