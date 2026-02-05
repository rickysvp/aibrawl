import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ArenaCanvas from '../components/ArenaCanvas';
import BattleLog from '../components/BattleLog';
import AgentCard from '../components/AgentCard';
import { Agent } from '../types';
import { Swords, Users, Trophy, Zap, TrendingUp, Plus, Wallet, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [currentRound, setCurrentRound] = useState(1);
  
  // 初始化竞技场
  useEffect(() => {
    if (systemAgents.length === 0) {
      initializeArena();
    }
  }, [initializeArena, systemAgents.length]);
  
  // 优化的战斗循环
  useEffect(() => {
    if (systemAgents.length === 0) return;
    
    let isRunning = true;
    
    const runBattleLoop = async () => {
      while (isRunning) {
        // 1. 准备阶段 - 选择参赛者
        setArenaPhase('selecting');
        startNewRound();
        setCurrentRound(prev => prev + 1);
        
        // 随机选择10个参赛者
        const availableAgents: Agent[] = [
          ...myAgents.filter(a => a.status === 'in_arena'),
          ...systemAgents.filter(a => a.status === 'in_arena' && a.hp > 0),
        ];
        
        const shuffled = [...availableAgents].sort(() => Math.random() - 0.5);
        const participants = shuffled.slice(0, 10);
        
        // 重置参赛者状态
        participants.forEach(p => {
          updateParticipant(p.id, { hp: p.maxHp, status: 'fighting' });
        });
        
        useGameStore.setState(state => ({
          arena: { 
            ...state.arena, 
            participants,
            selectedSlots: [],
            countdown: 3
          }
        }));
        
        addBattleLog({
          type: 'round_start',
          message: `第 ${currentRound} 轮开始！${participants.length} 名选手参战`,
          isHighlight: true,
        });
        
        // 2. 逐个点亮坑位 (3秒内完成)
        const slotInterval = 3000 / participants.length; // 均匀分布在3秒内
        for (let i = 0; i < participants.length; i++) {
          if (!isRunning) return;
          await new Promise(resolve => setTimeout(resolve, slotInterval));
          useGameStore.setState(state => ({
            arena: { ...state.arena, selectedSlots: [...state.arena.selectedSlots, i] }
          }));
        }
        
        // 3. 倒计时阶段 (3秒)
        setArenaPhase('countdown');
        for (let i = 3; i > 0; i--) {
          if (!isRunning) return;
          useGameStore.setState(state => ({
            arena: { ...state.arena, countdown: i }
          }));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 4. 战斗阶段 (10秒)
        setArenaPhase('fighting');
        useGameStore.setState(state => ({
          arena: { ...state.arena, countdown: 10 }
        }));
        
        // 战斗倒计时
        for (let i = 10; i > 0; i--) {
          if (!isRunning) return;
          useGameStore.setState(state => ({
            arena: { ...state.arena, countdown: i }
          }));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 5. 结算阶段
        setArenaPhase('settlement');
        
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
          message: `第 ${currentRound} 轮结束！冠军: ${top3[0]?.agent.name || '无'}`,
          isHighlight: true,
        });
        
        // 重置参赛者状态
        currentParticipants.forEach(p => {
          const newStatus = p.hp > 0 ? 'in_arena' : 'dead';
          updateParticipant(p.id, { status: newStatus, hp: p.maxHp });
        });
        
        // 等待5秒或用户关闭弹窗
        await new Promise(resolve => setTimeout(resolve, 5000));
        setShowSettlement(false);
        
        // 短暂等待后开始下一轮
        setArenaPhase('waiting');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
    
    // 启动战斗循环
    const timer = setTimeout(runBattleLoop, 1000);
    
    return () => {
      isRunning = false;
      clearTimeout(timer);
    };
  }, [systemAgents.length]);
  
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
                    <h2 className="text-lg font-semibold text-white">战斗舞台</h2>
                    <p className="text-xs text-white/40">实时战斗画面</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxury-green/10 border border-luxury-green/20">
                    <Users className="w-4 h-4 text-luxury-green" />
                    <span className="text-sm text-luxury-green font-mono">
                      {systemAgents.filter(a => a.status === 'in_arena').length + myArenaAgents.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxury-cyan/10 border border-luxury-cyan/20">
                    <TrendingUp className="w-4 h-4 text-luxury-cyan" />
                    <span className="text-sm text-luxury-cyan font-mono">#{arena.roundNumber || currentRound}</span>
                  </div>
                </div>
              </div>
              <div className="aspect-video p-4 relative">
                <ArenaCanvas 
                  participants={arena.participants}
                  phase={arena.phase}
                  countdown={arena.countdown}
                  selectedSlots={arena.selectedSlots}
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
