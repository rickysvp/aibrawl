import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import AgentCard from '../components/AgentCard';
import MintingModal from '../components/MintingModal';
import { Agent } from '../types';
import {
  Users,
  Plus,
  Filter,
  Sparkles,
  TrendingUp,
  Skull,
  Swords,
  Wallet,
  Zap,
  CheckSquare,
  Square,
  BatteryCharging,
  Rocket,
  Lock
} from 'lucide-react';

const Squad: React.FC = () => {
  const { t } = useTranslation();
  const {
    wallet,
    myAgents,
    mintAgent,
    mintCost,
    allocateFunds,
    joinArena,
    connectWallet
  } = useGameStore();
  
  const [mintCount, setMintCount] = useState(1);
  const [filter, setFilter] = useState<'all' | 'idle' | 'in_arena' | 'fighting'>('all');
  const [isMinting, setIsMinting] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintedAgents, setMintedAgents] = useState<Agent[]>([]);
  
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [batchAmount, setBatchAmount] = useState('');
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  
  const handleMint = async () => {
    if (!wallet.connected || wallet.balance < mintCost * mintCount) return;

    setShowMintModal(true);
    setIsMinting(true);
    setMintedAgents([]);

    // 播放铸造动画
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newAgents: Agent[] = [];
    for (let i = 0; i < mintCount; i++) {
      const agent = mintAgent();
      if (agent) {
        newAgents.push(agent);
      }
    }

    setMintedAgents(newAgents);
    setIsMinting(false);
  };
  
  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };
  
  const toggleSelectAll = () => {
    const idleAgentIds = idleAgents.map(a => a.id);
    if (selectedAgents.size === idleAgentIds.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(idleAgentIds));
    }
  };
  
  const handleBatchRecharge = () => {
    const totalAmount = parseFloat(batchAmount);
    if (!totalAmount || totalAmount <= 0) return;

    if (totalAmount > wallet.balance) {
      alert(`${t('wallet.insufficientBalance')}: ${totalAmount}, ${t('wallet.currentBalance')}: ${wallet.balance}`);
      return;
    }

    const amountPerAgent = Math.floor(totalAmount / selectedAgents.size);
    const remainder = totalAmount - (amountPerAgent * selectedAgents.size);

    const agentIds = Array.from(selectedAgents);
    agentIds.forEach((agentId, index) => {
      const amount = index === 0 ? amountPerAgent + remainder : amountPerAgent;
      if (amount > 0) {
        allocateFunds(agentId, amount);
      }
    });

    setBatchAmount('');
    setSelectedAgents(new Set());
    alert(`${t('wallet.rechargeSuccess')} ${totalAmount} ${t('squad.to')} ${selectedAgents.size} ${t('squad.agents')}, ${t('squad.each')} ~${amountPerAgent}`);
  };
  
  const handleBatchJoinArena = () => {
    const eligibleAgents = myAgents.filter(
      a => a.status === 'idle' && a.balance > 0 && !selectedAgents.has(a.id)
    );

    const agentsToJoin = [...eligibleAgents, ...myAgents.filter(a => selectedAgents.has(a.id))]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (agentsToJoin.length === 0) {
      alert(t('squad.noEligibleAgents'));
      return;
    }

    agentsToJoin.forEach(agent => {
      if (agent.status === 'idle' && agent.balance > 0) {
        joinArena(agent.id);
      }
    });

    setSelectedAgents(new Set());
    alert(`${t('squad.joinSuccess')} ${agentsToJoin.length} ${t('squad.agents')} ${t('arena.title')}`);
  };

  const handleRechargeAll = () => {
    if (idleAgents.length === 0) {
      alert(t('squad.noIdleAgents'));
      return;
    }

    const totalAmount = parseFloat(batchAmount);
    if (!totalAmount || totalAmount <= 0) {
      alert(t('squad.invalidAmount'));
      return;
    }

    if (totalAmount > wallet.balance) {
      alert(`${t('wallet.insufficientBalance')}: ${totalAmount}, ${t('wallet.currentBalance')}: ${wallet.balance}`);
      return;
    }

    const amountPerAgent = Math.floor(totalAmount / idleAgents.length);
    const remainder = totalAmount - (amountPerAgent * idleAgents.length);

    idleAgents.forEach((agent, index) => {
      const amount = index === 0 ? amountPerAgent + remainder : amountPerAgent;
      if (amount > 0) {
        allocateFunds(agent.id, amount);
      }
    });

    setBatchAmount('');
    alert(`${t('wallet.rechargeSuccess')} ${totalAmount} ${t('squad.to')} ${idleAgents.length} ${t('squad.agents')}, ${t('squad.each')} ~${amountPerAgent}`);
  };

  const handleJoinAllArena = () => {
    const eligibleAgents = myAgents.filter(
      a => a.status === 'idle' && a.balance > 0
    );

    if (eligibleAgents.length === 0) {
      alert(t('squad.noEligibleAgents'));
      return;
    }

    eligibleAgents.forEach(agent => {
      joinArena(agent.id);
    });

    alert(`${t('squad.joinSuccess')} ${eligibleAgents.length} ${t('squad.agents')} ${t('arena.title')}`);
  };
  
  const filteredAgents = myAgents.filter(agent => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });
  
  const idleAgents = myAgents.filter(a => a.status === 'idle');
  const canJoinArena = idleAgents.filter(a => a.balance > 0);
  
  const totalBalance = myAgents.reduce((sum, a) => sum + a.balance, 0);
  const totalProfit = myAgents.reduce((sum, a) => sum + a.netProfit, 0);
  const agentsTotalBalance = totalBalance;
  const profitPercentage = totalBalance > 0 ? (totalProfit / totalBalance) * 100 : 0;
  const avgWinRate = myAgents.length > 0
    ? Math.round(myAgents.reduce((sum, a) => sum + (a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0), 0) / myAgents.length * 100)
    : 0;

  const getFilterConfig = (key: string) => {
    switch (key) {
      case 'all': return { label: t('squad.all'), color: 'bg-luxury-purple', icon: Users };
      case 'idle': return { label: t('squad.idle'), color: 'bg-luxury-cyan', icon: Wallet };
      case 'in_arena': return { label: t('arena.waiting'), color: 'bg-luxury-gold', icon: Swords };
      case 'fighting': return { label: t('arena.fighting'), color: 'bg-luxury-rose', icon: Skull };
      default: return { label: t('squad.all'), color: 'bg-luxury-purple', icon: Users };
    }
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-luxury-purple/20 to-luxury-cyan/20 border border-luxury-purple/30 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-luxury-purple" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('wallet.connectFirst')}</h2>
          <p className="text-white/40 mb-8">{t('wallet.connectDesc') || 'Please connect your wallet to continue'}</p>
          <button
            onClick={() => connectWallet('wallet')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t('wallet.connectWallet')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-purple/10 border border-luxury-purple/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-luxury-purple" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('squad.agents')}</span>
            </div>
            <p className="text-3xl font-bold text-white font-display">{myAgents.length}</p>
          </div>

          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-luxury-gold" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('wallet.locked')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-gold font-mono">{agentsTotalBalance.toLocaleString()}</p>
          </div>

          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-green/10 border border-luxury-green/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-luxury-green" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('squad.totalProfit')}</span>
            </div>
            <p className={`text-3xl font-bold font-mono ${totalProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}
            </p>
            <p className={`text-sm mt-1 ${profitPercentage >= 0 ? 'text-luxury-green/70' : 'text-luxury-rose/70'}`}>
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
            </p>
          </div>

          <div className="card-luxury rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-cyan/10 border border-luxury-cyan/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-luxury-cyan" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('squad.avgWinRate')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-cyan font-mono">{avgWinRate}%</p>
          </div>
        </div>

        {/* 快速铸造区 */}
        <div className="card-luxury rounded-2xl overflow-hidden mb-8 border-luxury-purple/20">
          <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-luxury-purple/10 to-transparent">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-luxury-purple" />
              <div>
                <h2 className="text-lg font-semibold text-white">{t('squad.quickMint')}</h2>
                <p className="text-xs text-white/40">{t('squad.mintCost')}: <span className="text-luxury-gold">{mintCost}</span> / {t('squad.each')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {[1, 5, 10].map(count => (
                    <button
                      key={count}
                      onClick={() => setMintCount(count)}
                      className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                        mintCount === count
                          ? 'bg-luxury-purple text-white shadow-lg shadow-luxury-purple/25'
                          : 'bg-void-light text-white/60 hover:text-white border border-white/10'
                      }`}
                    >
                      {count}{t('squad.count')}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleMint}
                disabled={isMinting || wallet.balance < mintCost * mintCount}
                className="group relative px-8 py-3.5 rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <span className="relative flex items-center gap-2 text-white font-semibold">
                  {isMinting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('squad.minting')}...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {t('squad.mint')} ({mintCost * mintCount})
                    </>
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* 筛选器 & 批量操作 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-white/40">
              <Filter className="w-4 h-4" />
              <span className="text-sm">{t('arena.filter')}</span>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'idle', 'in_arena', 'fighting'] as const).map(key => {
                const config = getFilterConfig(key);
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === key
                        ? `${config.color} text-white shadow-lg`
                        : 'bg-void-light text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 批量操作入口 */}
          {myAgents.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBatchPanel(!showBatchPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showBatchPanel
                    ? 'bg-luxury-cyan text-white shadow-lg shadow-luxury-cyan/25'
                    : 'bg-void-panel border border-white/10 text-white/70 hover:text-white hover:border-luxury-cyan/50'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{t('squad.batchOperations')}</span>
                {selectedAgents.size > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                    {selectedAgents.size}
                  </span>
                )}
              </button>

              {showBatchPanel && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-void-panel rounded-xl border border-white/10 p-4 z-50 shadow-2xl">
                  <div className="flex gap-2 mb-4 p-1 bg-void rounded-lg">
                    <button
                      onClick={() => setSelectedAgents(new Set())}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedAgents.size === 0
                          ? 'bg-luxury-cyan text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {t('squad.allOperations')}
                    </button>
                    <button
                      onClick={() => setSelectedAgents(new Set())}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedAgents.size > 0
                          ? 'bg-luxury-cyan text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {t('squad.selectOperations')}
                    </button>
                  </div>

                  {selectedAgents.size === 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-void rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-luxury-green flex items-center justify-center">
                            <BatteryCharging className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{t('squad.rechargeAll')}</p>
                            <p className="text-[10px] text-white/40">{t('squad.distributeToAll')} {idleAgents.length} {t('squad.agents')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={batchAmount}
                            onChange={(e) => setBatchAmount(e.target.value)}
                            placeholder={t('wallet.totalAmount')}
                            className="w-20 bg-void-panel border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-luxury-green focus:outline-none"
                          />
                          <button
                            onClick={handleRechargeAll}
                            disabled={!batchAmount || parseFloat(batchAmount) <= 0 || idleAgents.length === 0}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-luxury-green text-white text-sm font-medium hover:bg-luxury-green/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {t('wallet.recharge')}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-void rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-luxury-gold flex items-center justify-center">
                            <Rocket className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{t('squad.joinAll')}</p>
                            <p className="text-[10px] text-white/40">{t('squad.joinAllDesc')}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleJoinAllArena}
                          disabled={canJoinArena.length === 0}
                          className="w-full py-2 rounded-lg bg-luxury-gold text-white text-sm font-medium hover:bg-luxury-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('arena.join')} ({canJoinArena.length})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-void rounded-lg border border-white/5">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
                        >
                          {selectedAgents.size === idleAgents.length && idleAgents.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-luxury-cyan" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          <span className="text-xs">{t('squad.selectAll')} ({selectedAgents.size}/{idleAgents.length})</span>
                        </button>
                        <button
                          onClick={() => setSelectedAgents(new Set())}
                          className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
                        >
                          {t('squad.clear')}
                        </button>
                      </div>

                      <button
                        onClick={handleBatchJoinArena}
                        disabled={selectedAgents.size === 0}
                        className="w-full py-2 rounded-lg bg-luxury-gold text-white text-sm font-medium hover:bg-luxury-gold/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('squad.joinArena')} ({selectedAgents.size})
                      </button>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={batchAmount}
                          onChange={(e) => setBatchAmount(e.target.value)}
                          placeholder={t('wallet.totalAmount')}
                          className="w-20 bg-void border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-luxury-green focus:outline-none"
                        />
                        <button
                          onClick={handleBatchRecharge}
                          disabled={!batchAmount || parseFloat(batchAmount) <= 0}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-luxury-green text-white text-sm font-medium hover:bg-luxury-green/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('wallet.recharge')} ({selectedAgents.size})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agents 列表 - 表头 */}
        {filteredAgents.length > 0 && (
          <div className="hidden md:flex items-center gap-4 px-3 py-2 text-xs text-white/40 uppercase tracking-wider border-b border-white/5 mb-2">
            <div className="w-12 flex-shrink-0"></div>
            <div className="w-32 flex-shrink-0">{t('squad.name')}</div>
            <div className="w-20 flex-shrink-0">{t('squad.status')}</div>
            <div className="w-24 flex-shrink-0">{t('wallet.balance')}</div>
            <div className="w-24 flex-shrink-0">{t('squad.profit')}</div>
            <div className="w-20 flex-shrink-0">{t('squad.battles')}</div>
            <div className="w-20 flex-shrink-0">{t('squad.winRate')}</div>
            <div className="flex-1 text-right">{t('squad.actions')}</div>
            <div className="w-4 flex-shrink-0"></div>
          </div>
        )}

        {/* Agents 列表 */}
        {filteredAgents.length === 0 ? (
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {myAgents.length === 0 ? t('squad.noAgents') : t('squad.noFilteredAgents')}
            </h2>
            <p className="text-white/40">
              {myAgents.length === 0 ? t('squad.mintFirst') : t('squad.tryOtherFilter')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                className={`relative transition-all ${
                  selectedAgents.has(agent.id) ? 'ring-2 ring-luxury-cyan rounded-xl' : ''
                }`}
              >
                {agent.status === 'idle' && showBatchPanel && selectedAgents.size > 0 && (
                  <button
                    onClick={() => toggleAgentSelection(agent.id)}
                    className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-lg bg-luxury-cyan border-2 border-white flex items-center justify-center shadow-lg"
                  >
                    <CheckSquare className="w-5 h-5 text-white" />
                  </button>
                )}
                {agent.status === 'idle' && showBatchPanel && selectedAgents.size === 0 && (
                  <button
                    onClick={() => toggleAgentSelection(agent.id)}
                    className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-lg bg-void-panel border-2 border-white/30 flex items-center justify-center shadow-lg hover:border-luxury-cyan transition-colors"
                  >
                    <Square className="w-5 h-5 text-white/40" />
                  </button>
                )}
                {agent.status === 'idle' && showBatchPanel && (
                  <div 
                    onClick={() => toggleAgentSelection(agent.id)}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />
                )}
                <AgentCard agent={agent} viewMode="list" />
              </div>
            ))}
          </div>
        )}
      </div>

      <MintingModal
        isOpen={showMintModal}
        isMinting={isMinting}
        mintedAgents={mintedAgents}
        onClose={() => setShowMintModal(false)}
      />
    </div>
  );
};

export default Squad;
