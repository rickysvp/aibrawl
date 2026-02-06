import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Agent, Rarity } from '../types';
import PixelAgent from './PixelAgent';
import {
  X,
  Zap,
  Shield,
  Flame,
  Crosshair,
  Wind,
  Trophy,
  Target,
  TrendingUp,
  Wallet,
  Swords,
  Calendar,
  Skull,
  Crown,
  Medal,
  Sparkles,
  Gem
} from 'lucide-react';

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

// 稀有度配置
const rarityConfig: Record<Rarity, { name: string; color: string; icon: React.ElementType }> = {
  common: { name: '普通', color: '#9ca3af', icon: Sparkles },
  rare: { name: '稀有', color: '#3b82f6', icon: Gem },
  epic: { name: '史诗', color: '#a855f7', icon: Zap },
  legendary: { name: '传说', color: '#f59e0b', icon: Trophy },
  mythic: { name: '神话', color: '#ef4444', icon: Flame },
};

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ agent, isOpen, onClose }) => {
  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!agent || !isOpen) return null;

  const rarity = rarityConfig[agent.rarity];
  const RarityIcon = rarity.icon;

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取结果图标
  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win':
        return <Crown className="w-4 h-4 text-luxury-gold" />;
      case 'loss':
        return <Skull className="w-4 h-4 text-luxury-rose" />;
      default:
        return <Medal className="w-4 h-4 text-white/40" />;
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* 弹窗容器 - 使用flex居中 */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1a2e] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div
                className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                style={{ background: `linear-gradient(90deg, ${rarity.color}30, ${rarity.color}10)` }}
              >
                <div className="flex items-center gap-3">
                  <RarityIcon className="w-6 h-6" style={{ color: rarity.color }} />
                  <div>
                    <h2 className="text-xl font-bold text-white">{agent.name}</h2>
                    <p className="text-sm text-white/50">NFT #{agent.nftId}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* 内容区域 - 可滚动 */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* NFT形象 + 余额/利润 布局 */}
                <div className="flex gap-4 mb-6">
                  {/* NFT形象 - 左侧 */}
                  <div
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${rarity.color}40, ${rarity.color}60)`,
                      border: `3px solid ${rarity.color}`,
                      boxShadow: `0 0 30px ${rarity.color}40`
                    }}
                  >
                    <PixelAgent agent={agent} size={80} />
                  </div>

                  {/* 余额和利润 - 右侧上下叠 */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-luxury-gold" />
                      <div>
                        <p className="text-xs text-white/40">余额</p>
                        <p className="text-lg font-bold text-luxury-gold font-mono">{agent.balance.toFixed(0)} MON</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                      <TrendingUp className={`w-5 h-5 ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`} />
                      <div>
                        <p className="text-xs text-white/40">净利润</p>
                        <p className={`text-lg font-bold font-mono ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                          {agent.netProfit >= 0 ? '+' : ''}{agent.netProfit.toLocaleString()} MON
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 场次、胜率、冠军 - 同一行 */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 bg-white/5 rounded-xl p-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-luxury-cyan" />
                      <span className="text-xl sm:text-2xl font-bold text-white font-mono">{agent.totalBattles}</span>
                    </div>
                    <p className="text-xs text-white/40">总场次</p>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <Target className={`w-4 h-4 sm:w-5 sm:h-5 ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`} />
                      <span className={`text-xl sm:text-2xl font-bold font-mono ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`}>
                        {agent.winRate}%
                      </span>
                    </div>
                    <p className="text-xs text-white/40">胜率</p>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-luxury-gold" />
                      <span className="text-xl sm:text-2xl font-bold text-luxury-gold font-mono">{agent.tournamentWins}</span>
                    </div>
                    <p className="text-xs text-white/40">冠军</p>
                  </div>
                </div>

                {/* 属性 - 不显示总点数 */}
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-medium text-white mb-3 text-center">属性</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center">
                      <Zap className="w-6 h-6 mx-auto text-luxury-rose mb-1" />
                      <p className="text-lg font-bold text-luxury-rose font-mono">{agent.attack}</p>
                      <p className="text-xs text-white/40">攻击</p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-6 h-6 mx-auto text-luxury-cyan mb-1" />
                      <p className="text-lg font-bold text-luxury-cyan font-mono">{agent.defense}</p>
                      <p className="text-xs text-white/40">防御</p>
                    </div>
                    <div className="text-center">
                      <Flame className="w-6 h-6 mx-auto text-luxury-amber mb-1" />
                      <p className="text-lg font-bold text-luxury-amber font-mono">{agent.crit}</p>
                      <p className="text-xs text-white/40">暴击</p>
                    </div>
                    <div className="text-center">
                      <Crosshair className="w-6 h-6 mx-auto text-luxury-purple mb-1" />
                      <p className="text-lg font-bold text-luxury-purple font-mono">{agent.hit}</p>
                      <p className="text-xs text-white/40">命中</p>
                    </div>
                    <div className="text-center">
                      <Wind className="w-6 h-6 mx-auto text-luxury-green mb-1" />
                      <p className="text-lg font-bold text-luxury-green font-mono">{agent.agility}</p>
                      <p className="text-xs text-white/40">敏捷</p>
                    </div>
                  </div>
                </div>

                {/* 战斗历史 - 显示盈亏MON */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-luxury-cyan" />
                    战斗历史 ({agent.battleHistory.length}场)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agent.battleHistory.slice(0, 20).map((record) => (
                      <div
                        key={record.id}
                        className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                      >
                        {getResultIcon(record.result)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${
                              record.result === 'win' ? 'text-luxury-gold' : 'text-luxury-rose'
                            }`}>
                              {record.result === 'win' ? '胜利' : '失败'}
                            </span>
                            {record.isTournament && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold">
                                锦标赛
                              </span>
                            )}
                            {record.rank && record.rank <= 3 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-luxury-purple/20 text-luxury-purple">
                                #{record.rank}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">
                            vs {record.opponent}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-mono ${record.earnings >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                            {record.earnings >= 0 ? '+' : ''}{record.earnings} MON
                          </p>
                          <p className="text-xs text-white/30">
                            {formatDate(record.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // 使用Portal渲染到body
  return createPortal(modalContent, document.body);
};

export default AgentDetailModal;
