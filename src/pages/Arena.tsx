import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import ArenaCanvas from '../components/ArenaCanvas';
import BattleLog from '../components/BattleLog';
import AgentCard from '../components/AgentCard';
import { Agent } from '../types';
import { Swords, Users, Trophy, Plus, Wallet, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 生成今日 TOP 100 排行榜数据
const generateTop100 = () => {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
  const colors = ['text-luxury-gold', 'text-luxury-cyan', 'text-luxury-purple', 'text-luxury-rose', 'text-luxury-green'];
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    name: `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 9999)}`,
    profit: Math.floor(Math.random() * 50000) + 1000,
    color: colors[Math.floor(Math.random() * colors.length)]
  })).sort((a, b) => b.profit - a.profit);
};

// 跑马灯组件
const LeaderboardMarquee: React.FC = () => {
  const top100 = useMemo(() => generateTop100(), []);
  const navigate = useNavigate();

  return (
    <div className="w-full bg-void-panel/80 border border-white/5 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center">
        {/* 标题 */}
        <div className="flex-shrink-0 px-4 py-2 bg-luxury-gold/10 border-r border-white/10 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-luxury-gold" />
          <span className="text-xs font-semibold text-luxury-gold">TOP Profit</span>
        </div>
        {/* 滚动内容 */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {top100.map((agent, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2">
                <span className="text-xs text-white/40 font-mono">#{agent.rank}</span>
                <span className={`text-xs font-medium ${agent.color}`}>{agent.name}</span>
                <span className="text-xs text-luxury-green font-mono">+{agent.profit.toLocaleString()}</span>
                <span className="text-xs text-white/20">$MON</span>
              </div>
            ))}
          </div>
        </div>
        {/* 进入榜单按钮 */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex-shrink-0 px-3 py-2 bg-luxury-gold/10 border-l border-white/10 hover:bg-luxury-gold/20 active:bg-luxury-gold/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="查看完整榜单"
        >
          <ChevronRight className="w-5 h-5 text-luxury-gold" />
        </button>
      </div>
    </div>
  );
};

// 战斗阶段类型 - 与 store 中的 RoundPhase 保持一致
type BattlePhase = 'waiting' | 'selecting' | 'loading' | 'countdown' | 'fighting' | 'settlement';

// 计时器状态
interface TimerState {
  phase: BattlePhase;
  countdown: number;
  round: number;
  participants: Agent[];
  selectedSlots: number[];
}

const Arena: React.FC = () => {
  const { t } = useTranslation();
  const {
    arena,
    myAgents,
    systemAgents,
    wallet,
    initializeArena,
    setArenaPhase,
    addBattleLog,
    updateParticipant,
    setTop3,
    myBattleLogs,
  } = useGameStore();

  const navigate = useNavigate();
  const [logTab, setLogTab] = useState<'arena' | 'my'>('arena');
  const [showSettlement, setShowSettlement] = useState(false);

  // 当前战斗轮次显示（战斗开始时固定，战斗结束后更新）
  const [displayBattleRound, setDisplayBattleRound] = useState(1);

  // 排序状态
  const [sortBy, setSortBy] = useState<'balance' | 'winRate' | 'profit'>('balance');

  // 用于测量左侧高度
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelHeight, setLeftPanelHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (leftPanelRef.current) {
        setLeftPanelHeight(leftPanelRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // 使用 ref 来管理计时器状态，避免闭包问题
  const timerStateRef = useRef<TimerState>({
    phase: 'waiting',
    countdown: 0,
    round: 1,
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
  
  // 初始化竞技场
  useEffect(() => {
    if (systemAgents.length === 0) {
      initializeArena();
    }
  }, [initializeArena, systemAgents.length]);
  
  // 观察用户Agents参与的战斗
  useEffect(() => {
    if (systemAgents.length === 0) return;

    let isActive = true;

    const runObservationLoop = async () => {
      // 初始等待
      await new Promise(resolve => setTimeout(resolve, 1000));

      while (isActive) {
        // 获取当前状态
        const currentState = useGameStore.getState();
        const currentMyAgents = currentState.myAgents;
        const currentSystemAgents = currentState.systemAgents;
        const totalRounds = currentState.totalSystemRounds;

        // 检查用户是否有Agents在竞技场
        const myArenaAgents = currentMyAgents.filter(a => a.status === 'in_arena');

        // 如果用户没有Agents在竞技场，显示等待状态
        if (myArenaAgents.length === 0) {
          syncPhaseToStore('waiting');
          setDisplayBattleRound(totalRounds);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // ===== 用户有Agents在竞技场，开始观察模式 =====
        syncPhaseToStore('selecting');

        // 使用当前系统总轮次作为观察轮次
        setDisplayBattleRound(totalRounds);

        // 随机选择1个用户Agent进行观察（如果用户有多个）
        const observedAgent = myArenaAgents[Math.floor(Math.random() * myArenaAgents.length)];

        // 选择参赛者：观察的Agent + 9个系统Agents
        let selectedParticipants: Agent[] = [observedAgent];

        // 用系统Agents补足到10个
        const systemArenaAgents = currentSystemAgents.filter(a => a.status === 'in_arena' && a.id !== observedAgent.id);
        const shuffledSystem = [...systemArenaAgents].sort(() => Math.random() - 0.5);
        selectedParticipants = [...selectedParticipants, ...shuffledSystem.slice(0, 9)];

        // 随机打乱位置
        selectedParticipants = selectedParticipants.sort(() => Math.random() - 0.5);

        // 重置参赛者状态
        selectedParticipants.forEach(p => {
          updateParticipant(p.id, { hp: p.maxHp, status: 'fighting' });
        });

        // 记录日志
        addBattleLog({
          type: 'round_start',
          message: `观察战斗: ${observedAgent.name} 正在战斗!`,
          isHighlight: true,
        });

        // ===== 2. 逐个落座动画 (3秒) =====
        syncParticipantsToStore([]);
        syncSelectedSlotsToStore([]);

        const slotInterval = 3000 / selectedParticipants.length;

        for (let i = 0; i < selectedParticipants.length; i++) {
          if (!isActive) return;
          await new Promise(resolve => setTimeout(resolve, slotInterval));

          const currentParticipants: Agent[] = [];
          for (let j = 0; j <= i; j++) {
            currentParticipants[j] = selectedParticipants[j];
          }

          syncParticipantsToStore(currentParticipants);
          syncSelectedSlotsToStore([...timerStateRef.current.selectedSlots, i]);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // ===== 3. 进入战场加载阶段 (1秒进度条) =====
        syncPhaseToStore('loading');
        syncCountdownToStore(100);

        for (let progress = 0; progress <= 100; progress += 10) {
          if (!isActive) return;
          syncCountdownToStore(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // ===== 4. 战斗阶段 (5秒，与后台战斗同步) =====
        syncPhaseToStore('fighting');
        syncCountdownToStore(5);

        for (let i = 5; i > 0; i--) {
          if (!isActive) return;
          syncCountdownToStore(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // ===== 5. 结算阶段 =====
        syncPhaseToStore('settlement');

        // 模拟战斗结果（实际应该从后台战斗结果获取）
        const results = selectedParticipants.map(p => {
          const isObserved = p.id === observedAgent.id;
          // 观察的Agent有更高概率获胜
          const winProbability = isObserved ? 0.4 : 0.1;
          const survived = Math.random() < (0.3 + winProbability);
          const profit = survived ? Math.floor(Math.random() * 500) : -Math.floor(Math.random() * 300);
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
          message: `战斗结束! 冠军: ${top3[0]?.agent.name || 'None'}`,
          isHighlight: true,
        });

        // 更新每个Agent的战斗统计
        results.forEach(r => {
          const isWin = r.survived && r.profit > 0;
          const isLoss = !r.survived || r.profit < 0;
          
          // 获取当前Agent的完整数据
          const currentAgent = useGameStore.getState().myAgents.find(a => a.id === r.agent.id) ||
                               useGameStore.getState().systemAgents.find(a => a.id === r.agent.id);
          
          if (currentAgent) {
            const newWins = isWin ? currentAgent.wins + 1 : currentAgent.wins;
            const newLosses = isLoss ? currentAgent.losses + 1 : currentAgent.losses;
            const newTotalBattles = currentAgent.totalBattles + 1;
            const newWinRate = Math.round((newWins / newTotalBattles) * 100);
            const newNetProfit = currentAgent.netProfit + r.profit;
            
            // 添加战斗记录
            const battleRecord = {
              id: `battle-${Date.now()}-${r.agent.id}`,
              timestamp: Date.now(),
              opponent: 'Arena Battle',
              result: isWin ? 'win' : 'loss' as 'win' | 'loss',
              damageDealt: Math.abs(r.profit),
              damageTaken: 0,
              earnings: r.profit,
              kills: r.survived ? 1 : 0,
              isTournament: false,
            };
            
            // 确保使用战斗结束时的最终余额
            const finalBalance = r.agent.balance;
            
            updateParticipant(r.agent.id, {
              status: r.survived ? 'in_arena' : 'dead',
              hp: r.agent.maxHp,
              balance: finalBalance,
              wins: newWins,
              losses: newLosses,
              totalBattles: newTotalBattles,
              winRate: newWinRate,
              netProfit: newNetProfit,
              battleHistory: [battleRecord, ...currentAgent.battleHistory].slice(0, 50),
            });
          } else {
            // 系统Agent简单更新
            updateParticipant(r.agent.id, {
              status: r.survived ? 'in_arena' : 'dead',
              hp: r.agent.maxHp,
            });
          }
        });

        // 3秒倒计时后关闭结算层
        for (let i = 3; i > 0; i--) {
          if (!isActive) return;
          // 更新倒计时显示
          const settlementEl = document.getElementById('settlement-countdown');
          if (settlementEl) {
            settlementEl.textContent = `${i}秒后开始下一轮...`;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setShowSettlement(false);
        
        // ===== 6. 等待阶段 =====
        // 清空座位，显示等待状态
        syncParticipantsToStore([]);
        syncSelectedSlotsToStore([]);
        syncPhaseToStore('waiting');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
    
    runObservationLoop();
    
    return () => {
      isActive = false;
    };
  }, [systemAgents.length]); // 只在 systemAgents 初始化后执行一次
  
  // 我的在竞技场的 Agents
  const myArenaAgents = myAgents.filter(a => a.status === 'in_arena' || a.status === 'fighting');

  // 排序后的 Agents
  const sortedAgents = useMemo(() => {
    return [...myAgents].sort((a: Agent, b: Agent) => {
      switch (sortBy) {
        case 'balance':
          return b.balance - a.balance;
        case 'winRate':
          const totalA = a.wins + a.losses;
          const totalB = b.wins + b.losses;
          const winRateA = totalA > 0 ? a.wins / totalA : 0;
          const winRateB = totalB > 0 ? b.wins / totalB : 0;
          return winRateB - winRateA;
        case 'profit':
          // 使用 netProfit 作为盈亏
          return b.netProfit - a.netProfit;
        default:
          return 0;
      }
    });
  }, [myAgents, sortBy]);

  // 处理创建 Agent
  const handleCreateAgent = () => {
    if (!wallet.connected) {
      alert(t('wallet.connectFirst'));
      return;
    }
    navigate('/squad');
  };

  // 使用 ref 中的状态传递给子组件
  const currentPhase = timerStateRef.current.phase;
  const currentCountdown = timerStateRef.current.countdown;
  const currentSelectedSlots = timerStateRef.current.selectedSlots;

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* 排行榜跑马灯 - 在竞技场标题上方 */}
        <LeaderboardMarquee />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：竞技场 */}
          <div ref={leftPanelRef} className="lg:col-span-3 space-y-6 relative">
            {/* 战斗画面 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              <div className="px-6 h-[72px] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">BATTLE</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 font-mono">
                    {t('arena.round')} {displayBattleRound.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-luxury-green/5 border border-luxury-green/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-luxury-green"></span>
                  </span>
                  <Users className="w-3.5 h-3.5 text-luxury-green" />
                  <span className="text-xs font-semibold text-luxury-green font-mono">
                    {systemAgents.filter(a => a.status === 'in_arena').length + myArenaAgents.length}
                  </span>
                </div>
              </div>
              <div className="aspect-video p-4 relative">
                <ArenaCanvas
                  phase={currentPhase}
                  countdown={currentCountdown}
                  selectedSlots={currentSelectedSlots}
                />
                
                {/* 结算弹窗 */}
                {showSettlement && arena.top3.length > 0 && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-void-panel/90 rounded-2xl overflow-hidden border border-luxury-gold/30 max-w-[360px] w-[90%] animate-scale-in shadow-2xl shadow-luxury-gold/20">
                      {/* 头部 */}
                      <div className="px-4 py-3 bg-gradient-to-r from-luxury-gold/20 via-luxury-amber/10 to-luxury-gold/20 border-b border-luxury-gold/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-luxury-gold" />
                            <div>
                              <h3 className="text-xs font-bold text-luxury-gold font-display">{t('arena.round')} {displayBattleRound.toLocaleString()}</h3>
                              <p className="text-[10px] text-white/40">{t('leaderboard.top3')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowSettlement(false)}
                            className="p-1 rounded bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* TOP3 布局 - 第一名在上，二三名在下并排 */}
                      <div className="p-3">
                        {/* 第一名 - 突出显示 */}
                        {arena.top3[0] && (
                          <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-luxury-gold/30 to-luxury-amber/20 border border-luxury-gold/50">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-luxury-gold text-void flex items-center justify-center text-lg font-bold shadow-lg shadow-luxury-gold/30">
                                🥇
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{arena.top3[0].agent.name}</p>
                                <p className="text-[10px] text-luxury-gold">{t('tournament.winner')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold font-mono" style={{ color: '#22c55e', textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>+{arena.top3[0].profit}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 第二、三名 - 并排显示 */}
                        <div className="grid grid-cols-2 gap-2">
                          {arena.top3[1] && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-gray-400/20 to-gray-300/10 border border-gray-400/30">
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-5 h-5 rounded bg-gray-300 text-void flex items-center justify-center text-xs font-bold">
                                  🥈
                                </div>
                                <span className="text-[10px] text-gray-300">{t('tournament.runnerUp')}</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white truncate">{arena.top3[1].agent.name}</p>
                              <p className="text-xs font-bold font-mono mt-0.5" style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}>+{arena.top3[1].profit}</p>
                            </div>
                          )}
                          {arena.top3[2] && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-700/20 to-amber-600/10 border border-amber-600/30">
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                                  🥉
                                </div>
                                <span className="text-[10px] text-amber-600">{t('tournament.thirdPlace')}</span>
                              </div>
                              <p className="text-[11px] font-semibold text-white truncate">{arena.top3[2].agent.name}</p>
                              <p className="text-xs font-bold font-mono mt-0.5" style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}>+{arena.top3[2].profit}</p>
                            </div>
                          )}
                        </div>

                        {/* 提示 */}
                        <p id="settlement-countdown" className="text-center text-white/30 text-[10px] mt-3">
                          {t('common.loading')}...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 战斗日志 - Tab 切换 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              {/* Tab 头部 - 简化设计 */}
              <div className="px-6 py-3 border-b border-white/5">
                <div className="flex items-center relative bg-void-light/20 rounded-xl p-1 w-fit isolate">
                  {/* 滑动背景指示器 - 在文字下方 */}
                  <motion.div
                    className="absolute inset-y-1 rounded-lg bg-luxury-purple/20 -z-10"
                    initial={false}
                    animate={{
                      x: logTab === 'arena' ? 4 : 'calc(100% + 4px)',
                      width: 'calc(50% - 4px)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                  <button
                    onClick={() => setLogTab('arena')}
                    className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      logTab === 'arena'
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Swords className="w-4 h-4" />
                      BATTLE LOG
                    </span>
                  </button>
                  <button
                    onClick={() => setLogTab('my')}
                    className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      logTab === 'my'
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      SQUAD LOG
                    </span>
                  </button>
                </div>
              </div>

              {/* 日志内容 - 优化动画 */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={logTab}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="p-4"
                  >
                    <BattleLog
                      logs={logTab === 'arena' ? arena.battleLogs : myBattleLogs}
                      maxHeight="280px"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* 右侧：我的小队 */}
          <div className="lg:col-span-2">
            {/* 小队概览 - 高度与左侧一致 */}
            <div className="card-luxury rounded-2xl overflow-hidden flex flex-col" style={{ height: leftPanelHeight > 0 ? leftPanelHeight : 'auto' }}>
              {/* 标题栏 + 铸造按钮 */}
              <div className="px-6 h-[72px] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">MY SQUAD</h2>
                </div>
                {/* 铸造按钮移到标题右侧 */}
                {wallet.connected && myAgents.length < 30 && (
                  <button
                    onClick={handleCreateAgent}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-luxury-purple/10 border border-luxury-purple/30 rounded-lg text-luxury-purple-light hover:bg-luxury-purple/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('squad.mint')}</span>
                  </button>
                )}
              </div>

              {/* 排序选项 */}
              {wallet.connected && myAgents.length > 0 && (
                <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
                  <span className="text-xs text-white/40">{t('arena.filter')}:</span>
                  <div className="flex gap-1">
                    {(['balance', 'winRate', 'profit'] as const).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => setSortBy(sort)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          sortBy === sort
                            ? 'bg-luxury-cyan/20 text-luxury-cyan border border-luxury-cyan/30'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        {sort === 'balance' ? t('wallet.balance') : sort === 'winRate' ? t('arena.winRate') : t('leaderboard.earnings')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 内容区域 - 可滚动 */}
              <div className="flex-1 overflow-y-auto p-6">
                {!wallet.connected ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/40 mb-2">{t('wallet.connectFirst')}</p>
                    <p className="text-xs text-white/20">{t('wallet.connectDesc')}</p>
                  </div>
                ) : myAgents.length === 0 ? (
                  /* 空状态 - 快捷创建入口 */
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-white/40 mb-4">{t('squad.noAgents')}</p>
                    <button
                      onClick={handleCreateAgent}
                      className="group relative px-6 py-3 rounded-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan" />
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="relative flex items-center gap-2 text-white font-semibold">
                        <Plus className="w-5 h-5" />
                        {t('squad.mintFirst')}
                      </span>
                    </button>
                    <p className="text-xs text-white/20 mt-3">{t('squad.mint')} 100 $MON</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* 表头 */}
                    <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-white/40 uppercase tracking-wider border-b border-white/5">
                      <div className="w-8 flex-shrink-0"></div>
                      <div className="w-20 flex-shrink-0">{t('squad.name')}</div>
                      <div className="w-14 flex-shrink-0 text-right">{t('squad.balance')}</div>
                      <div className="w-14 flex-shrink-0 text-right">{t('squad.profit')}</div>
                      <div className="flex-1 text-right">{t('squad.actions')}</div>
                    </div>
                    {/* 所有 Agents 列表 - 最多显示30个 */}
                    {sortedAgents.slice(0, 30).map(agent => (
                      <AgentCard key={agent.id} agent={agent} viewMode="list" />
                    ))}
                    {myAgents.length > 30 && (
                      <p className="text-xs text-white/30 text-center py-2">
                        {myAgents.length - 30} {t('squad.agents')} {t('common.hidden')}
                      </p>
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
