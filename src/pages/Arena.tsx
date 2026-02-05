import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import ArenaCanvas from '../components/ArenaCanvas';
import BattleLog from '../components/BattleLog';
import AgentCard from '../components/AgentCard';
import { Agent } from '../types';
import { Swords, Users, Trophy, Zap, TrendingUp, Plus, Wallet, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 战斗阶段类型 - 与 store 中的 RoundPhase 保持一致
type BattlePhase = 'waiting' | 'selecting' | 'countdown' | 'fighting' | 'settlement';

// 计时器状态
interface TimerState {
  phase: BattlePhase;
  countdown: number;
  round: number;
  participants: Agent[];
  selectedSlots: number[];
}

const Arena: React.FC = () => {
  const { 
    arena, 
    myAgents, 
    systemAgents,
    wallet,
    initializeArena, 
    startNewRound, 
    setArenaPhase,
    addBattleLog,
    updateParticipant,
    setTop3,
    myBattleLogs,
  } = useGameStore();
  
  const navigate = useNavigate();
  const [logTab, setLogTab] = useState<'arena' | 'my'>('arena');
  const [showSettlement, setShowSettlement] = useState(false);
  
  // 使用 ref 来管理计时器状态，避免闭包问题
  const timerStateRef = useRef<TimerState>({
    phase: 'waiting',
    countdown: 0,
    round: 0,
    participants: [],
    selectedSlots: [],
  });
  
  // 用于强制重新渲染的 state
  const [, forceUpdate] = useState({});
  
  // 同步 ref 状态到 store
  const syncPhaseToStore = useCallback((phase: BattlePhase) => {
    timerStateRef.current.phase = phase;
    setArenaPhase(phase);
    forceUpdate({}); // 触发重新渲染
  }, [setArenaPhase]);
  
  const syncCountdownToStore = useCallback((countdown: number) => {
    timerStateRef.current.countdown = countdown;
    useGameStore.setState(state => ({
      arena: { ...state.arena, countdown }
    }));
    forceUpdate({}); // 触发重新渲染
  }, []);
  
  const syncParticipantsToStore = useCallback((participants: Agent[]) => {
    timerStateRef.current.participants = participants;
    useGameStore.setState(state => ({
      arena: { ...state.arena, participants }
    }));
    forceUpdate({}); // 触发重新渲染
  }, []);
  
  const syncSelectedSlotsToStore = useCallback((selectedSlots: number[]) => {
    timerStateRef.current.selectedSlots = selectedSlots;
    useGameStore.setState(state => ({
      arena: { ...state.arena, selectedSlots }
    }));
    forceUpdate({}); // 触发重新渲染
  }, []);
  
  const incrementRound = useCallback(() => {
    timerStateRef.current.round += 1;
    forceUpdate({}); // 触发重新渲染
  }, []);
  
  // 初始化竞技场
  useEffect(() => {
    if (systemAgents.length === 0) {
      initializeArena();
    }
  }, [initializeArena, systemAgents.length]);
  
  // 战斗循环
  useEffect(() => {
    if (systemAgents.length === 0) return;
    
    let isActive = true;
    
    const runBattleLoop = async () => {
      // 初始等待
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      while (isActive) {
        // ===== 1. 准备阶段 - 选择参赛者 =====
        syncPhaseToStore('selecting');
        startNewRound();
        incrementRound();
        
        // 获取当前最新的 agents 状态
        const currentState = useGameStore.getState();
        const currentMyAgents = currentState.myAgents;
        const currentSystemAgents = currentState.systemAgents;
        
        // 优先选择用户的 Agents
        const myArenaAgents = currentMyAgents.filter(a => a.status === 'in_arena');
        const systemArenaAgents = currentSystemAgents.filter(a => a.status === 'in_arena' && a.hp > 0);
        
        // 如果没有足够的参赛者，等待后重试
        if (myArenaAgents.length + systemArenaAgents.length < 2) {
          console.log('等待更多参赛者...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // 优先选择用户 Agents，填满剩余位置用系统 Agents
        let participants: Agent[] = [];
        
        // 先加入所有用户的 Agents（最多10个）
        const shuffledMyAgents = [...myArenaAgents].sort(() => Math.random() - 0.5);
        participants = shuffledMyAgents.slice(0, 10);
        
        // 如果用户 Agents 不足10个，用系统 Agents 补足
        if (participants.length < 10) {
          const needed = 10 - participants.length;
          const shuffledSystem = [...systemArenaAgents].sort(() => Math.random() - 0.5);
          participants = [...participants, ...shuffledSystem.slice(0, needed)];
        }
        
        // 再次随机打乱，但确保用户 Agents 有机会排在前面显示
        participants = participants.sort(() => Math.random() - 0.5);
        
        // 重置参赛者状态
        participants.forEach(p => {
          updateParticipant(p.id, { hp: p.maxHp, status: 'fighting' });
        });
        
        // 同步参赛者到 store
        syncParticipantsToStore(participants);
        syncSelectedSlotsToStore([]);
        
        // 记录日志
        addBattleLog({
          type: 'round_start',
          message: `第 ${timerStateRef.current.round} 轮开始！${participants.length} 名选手参战`,
          isHighlight: true,
        });
        
        // ===== 2. 逐个点亮坑位 (3秒) =====
        const slotInterval = 3000 / participants.length;
        for (let i = 0; i < participants.length; i++) {
          if (!isActive) return;
          await new Promise(resolve => setTimeout(resolve, slotInterval));
          syncSelectedSlotsToStore([...timerStateRef.current.selectedSlots, i]);
        }
        
        // ===== 3. 倒计时阶段 (3秒) =====
        syncPhaseToStore('countdown');
        syncCountdownToStore(3);
        
        for (let i = 3; i > 0; i--) {
          if (!isActive) return;
          syncCountdownToStore(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // ===== 4. 战斗阶段 (10秒) =====
        syncPhaseToStore('fighting');
        syncCountdownToStore(10);
        
        for (let i = 10; i > 0; i--) {
          if (!isActive) return;
          syncCountdownToStore(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // ===== 5. 结算阶段 =====
        syncPhaseToStore('settlement');
        
        // 计算结果
        const currentParticipants = useGameStore.getState().arena.participants;
        const results = currentParticipants.map(p => {
          const survived = p.hp > 0;
          const profit = survived ? Math.floor(Math.random() * 100) + 50 : -Math.floor(Math.random() * 30);
          return { agent: p, profit, survived };
        });
        
        // 排序获取TOP3
        const top3 = results
          .filter(r => r.survived)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 3);
        
        setTop3(top3);
        setShowSettlement(true);
        
        addBattleLog({
          type: 'round_end',
          message: `第 ${timerStateRef.current.round} 轮结束！冠军: ${top3[0]?.agent.name || '无'}`,
          isHighlight: true,
        });
        
        // 重置参赛者状态
        currentParticipants.forEach(p => {
          const newStatus = p.hp > 0 ? 'in_arena' : 'dead';
          updateParticipant(p.id, { status: newStatus, hp: p.maxHp });
        });
        
        // 等待5秒
        await new Promise(resolve => setTimeout(resolve, 5000));
        setShowSettlement(false);
        
        // ===== 6. 等待阶段 =====
        syncPhaseToStore('waiting');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
    
    runBattleLoop();
    
    return () => {
      isActive = false;
    };
  }, [systemAgents.length]); // 只在 systemAgents 初始化后执行一次
  
  // 我的在竞技场的 Agents
  const myArenaAgents = myAgents.filter(a => a.status === 'in_arena' || a.status === 'fighting');
  const myIdleAgents = myAgents.filter(a => a.status === 'idle');

  // 处理创建 Agent
  const handleCreateAgent = () => {
    if (!wallet.connected) {
      alert('请先连接钱包');
      return;
    }
    navigate('/squad');
  };

  // 使用 ref 中的状态传递给子组件
  const currentPhase = timerStateRef.current.phase;
  const currentCountdown = timerStateRef.current.countdown;
  const currentRound = timerStateRef.current.round;
  const currentParticipants = timerStateRef.current.participants;
  const currentSelectedSlots = timerStateRef.current.selectedSlots;

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：竞技场 */}
          <div className="lg:col-span-3 space-y-6 relative">
            {/* 战斗画面 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-purple/20 to-luxury-cyan/20 border border-luxury-purple/30 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-luxury-purple-light" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">战斗舞台</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-mono">
                        Round {currentRound}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">实时战斗画面</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxury-green/10 border border-luxury-green/20">
                  <Users className="w-4 h-4 text-luxury-green" />
                  <span className="text-sm text-luxury-green font-mono">
                    {systemAgents.filter(a => a.status === 'in_arena').length + myArenaAgents.length}
                  </span>
                </div>
              </div>
              <div className="aspect-video p-4 relative">
                <ArenaCanvas 
                  participants={currentParticipants}
                  phase={currentPhase}
                  countdown={currentCountdown}
                  selectedSlots={currentSelectedSlots}
                />
                
                {/* 结算弹窗 */}
                {showSettlement && arena.top3.length > 0 && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm animate-fade-in">
                    <div className="card-luxury rounded-3xl overflow-hidden border-luxury-gold/30 max-w-md w-full mx-4 animate-scale-in">
                      {/* 头部 */}
                      <div className="px-8 py-6 bg-gradient-to-r from-luxury-gold/20 via-luxury-amber/10 to-luxury-gold/20 border-b border-luxury-gold/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-luxury-gold" />
                            <div>
                              <h3 className="text-xl font-bold text-luxury-gold font-display">本轮 TOP3</h3>
                              <p className="text-xs text-white/40">第 {currentRound} 轮结算</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowSettlement(false)}
                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* TOP3 列表 */}
                      <div className="p-8">
                        <div className="space-y-4">
                          {arena.top3.map((item, index) => (
                            <div 
                              key={item.agent.id} 
                              className={`flex items-center gap-4 p-4 rounded-2xl ${
                                index === 0 
                                  ? 'bg-gradient-to-r from-luxury-gold/20 to-luxury-amber/10 border border-luxury-gold/30' 
                                  : index === 1 
                                    ? 'bg-gradient-to-r from-gray-400/20 to-gray-300/10 border border-gray-400/30'
                                    : 'bg-gradient-to-r from-amber-700/20 to-amber-600/10 border border-amber-600/30'
                              }`}
                              style={{ animationDelay: `${index * 150}ms` }}
                            >
                              {/* 排名 */}
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${
                                index === 0 
                                  ? 'bg-luxury-gold text-void' 
                                  : index === 1 
                                    ? 'bg-gray-300 text-void'
                                    : 'bg-amber-600 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              
                              {/* 信息 */}
                              <div className="flex-1">
                                <p className="text-lg font-semibold text-white">{item.agent.name}</p>
                                <p className="text-xs text-white/40">
                                  HP: {item.agent.hp}/{item.agent.maxHp}
                                </p>
                              </div>
                              
                              {/* 盈利 */}
                              <div className="text-right">
                                <p className="text-2xl font-bold text-luxury-green font-mono">+{item.profit}</p>
                                <p className="text-xs text-white/40">盈利</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 提示 */}
                        <p className="text-center text-white/30 text-sm mt-6">
                          5秒后开始下一轮...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 战斗日志 - Tab 切换 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              {/* Tab 头部 */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogTab('arena')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      logTab === 'arena'
                        ? 'bg-luxury-purple/20 text-luxury-purple-light border border-luxury-purple/30'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    竞技场日志
                  </button>
                  <button
                    onClick={() => setLogTab('my')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      logTab === 'my'
                        ? 'bg-luxury-cyan/20 text-luxury-cyan border border-luxury-cyan/30'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    我的日志
                  </button>
                </div>
                <span className="text-xs text-white/40">
                  {logTab === 'arena' ? arena.battleLogs.length : myBattleLogs.length} 条记录
                </span>
              </div>
              
              {/* 日志内容 */}
              <div className="p-4">
                <BattleLog 
                  logs={logTab === 'arena' ? arena.battleLogs : myBattleLogs}
                  title=""
                  maxHeight="280px"
                />
              </div>
            </div>
          </div>
          
          {/* 右侧：我的小队 */}
          <div className="lg:col-span-2">
            {/* 小队概览 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-cyan/20 to-luxury-purple/20 border border-luxury-cyan/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-luxury-cyan" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">我的小队</h2>
                    <p className="text-xs text-white/40">管理你的 Agents</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {!wallet.connected ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/40 mb-2">请先连接钱包</p>
                    <p className="text-xs text-white/20">连接后即可管理你的 Agents</p>
                  </div>
                ) : myAgents.length === 0 ? (
                  /* 空状态 - 快捷创建入口 */
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/40 mb-4">你还没有 Agent</p>
                    <button
                      onClick={handleCreateAgent}
                      className="group relative px-6 py-3 rounded-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan" />
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="relative flex items-center gap-2 text-white font-semibold">
                        <Plus className="w-5 h-5" />
                        创建第一个 Agent
                      </span>
                    </button>
                    <p className="text-xs text-white/20 mt-3">铸造费用: 100</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 快捷铸造按钮 */}
                    <button
                      onClick={handleCreateAgent}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-luxury-purple/10 border border-luxury-purple/30 rounded-xl text-luxury-purple-light hover:bg-luxury-purple/20 transition-colors mb-4"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">铸造新 Agent</span>
                    </button>
                    
                    {/* 在竞技场的 Agents */}
                    {myArenaAgents.length > 0 && (
                      <div>
                        <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                          在竞技场 ({myArenaAgents.length})
                        </h3>
                        <div className="space-y-3">
                          {myArenaAgents.map(agent => (
                            <AgentCard key={agent.id} agent={agent} compact />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 空闲的 Agents */}
                    {myIdleAgents.length > 0 && (
                      <div>
                        <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-luxury-cyan" />
                          空闲中 ({myIdleAgents.length})
                        </h3>
                        <div className="space-y-3">
                          {myIdleAgents.slice(0, 3).map(agent => (
                            <AgentCard key={agent.id} agent={agent} compact />
                          ))}
                          {myIdleAgents.length > 3 && (
                            <p className="text-xs text-white/30 text-center py-2">
                              还有 {myIdleAgents.length - 3} 个 Agent...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;
