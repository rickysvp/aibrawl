import React, { useState } from 'react';
import { Agent, Rarity } from '../types';
import PixelAgent from './PixelAgent';
import AgentDetailModal from './AgentDetailModal';
import { useGameStore } from '../store/gameStore';
import { 
  Zap, 
  Shield, 
  Trophy,
  Target,
  Flame,
  Crosshair,
  Wind,
  Sparkles,
  Gem,
  Swords,
  TrendingUp,
  Wallet,
  Info,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

// 稀有度配置
const rarityConfig: Record<Rarity, { name: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  common: { 
    name: '普通', 
    color: '#9ca3af', 
    bgColor: 'bg-gray-500/10', 
    borderColor: 'border-gray-500/30',
    icon: Sparkles
  },
  rare: { 
    name: '稀有', 
    color: '#3b82f6', 
    bgColor: 'bg-blue-500/10', 
    borderColor: 'border-blue-500/30',
    icon: Gem
  },
  epic: { 
    name: '史诗', 
    color: '#a855f7', 
    bgColor: 'bg-purple-500/10', 
    borderColor: 'border-purple-500/30',
    icon: Zap
  },
  legendary: { 
    name: '传说', 
    color: '#f59e0b', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/30',
    icon: Trophy
  },
  mythic: { 
    name: '神话', 
    color: '#ef4444', 
    bgColor: 'bg-red-500/10', 
    borderColor: 'border-red-500/30',
    icon: Flame
  },
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { allocateFunds, withdrawFunds, wallet } = useGameStore();
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [showWithdrawInput, setShowWithdrawInput] = useState(false);
  const [amount, setAmount] = useState('');

  const handleDeposit = () => {
    const value = parseFloat(amount);
    if (value > 0 && wallet.balance >= value) {
      allocateFunds(agent.id, value);
      setAmount('');
      setShowDepositInput(false);
    }
  };

  const handleWithdraw = () => {
    const value = parseFloat(amount);
    if (value > 0 && agent.balance >= value) {
      withdrawFunds(agent.id, value);
      setAmount('');
      setShowWithdrawInput(false);
    }
  };
  
  const getStatusConfig = () => {
    switch (agent.status) {
      case 'idle': 
        return { 
          label: '空闲', 
          color: 'text-luxury-cyan',
          bgColor: 'bg-luxury-cyan/10',
          borderColor: 'border-luxury-cyan/30',
        };
      case 'in_arena': 
        return { 
          label: '待战', 
          color: 'text-luxury-gold',
          bgColor: 'bg-luxury-gold/10',
          borderColor: 'border-luxury-gold/30',
        };
      case 'fighting': 
        return { 
          label: '战斗中', 
          color: 'text-luxury-rose',
          bgColor: 'bg-luxury-rose/10',
          borderColor: 'border-luxury-rose/30',
        };
      case 'dead': 
        return { 
          label: '阵亡', 
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
        };
      default: 
        return { 
          label: '未知', 
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/30',
        };
    }
  };
  
  const status = getStatusConfig();
  const rarity = rarityConfig[agent.rarity];
  const RarityIcon = rarity.icon;

  if (compact) {
    return (
      <>
        <div 
          className="card-luxury rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setIsDetailOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Agent 头像 */}
              <div className="relative">
                <div 
                  className="absolute inset-0 blur-lg rounded-full transition-opacity duration-300"
                  style={{ 
                    backgroundColor: rarity.color,
                    opacity: isHovered ? 0.5 : 0.3 
                  }}
                />
                <div 
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${rarity.color}20, ${rarity.color}40)`,
                    border: `2px solid ${rarity.color}`
                  }}
                >
                  <PixelAgent agent={agent} size={36} />
                </div>
                
                {/* 稀有度指示器 */}
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: rarity.color }}
                >
                  <RarityIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              
              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{agent.name}</h4>
                  <span className="text-xs text-white/30">#{agent.nftId}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: rarity.color }}
                  >
                    {rarity.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              
              {/* 详情图标 */}
              <div className="text-white/30 group-hover:text-white/60 transition-colors">
                <Info className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 详情弹窗 */}
        <AgentDetailModal 
          agent={agent} 
          isOpen={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)} 
        />
      </>
    );
  }

  return (
    <>
      <div 
        className="card-luxury rounded-2xl overflow-hidden group cursor-pointer"
        onClick={() => setIsDetailOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderColor: isHovered ? rarity.color : undefined,
          borderWidth: isHovered ? '2px' : '1px',
        }}
      >
        {/* 头部 - 稀有度 + NFT编号 */}
        <div 
          className="px-4 py-1.5 flex items-center justify-between"
          style={{ 
            background: `linear-gradient(90deg, ${rarity.color}20, ${rarity.color}05)`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <RarityIcon className="w-3.5 h-3.5" style={{ color: rarity.color }} />
            <span className="text-xs font-medium" style={{ color: rarity.color }}>
              {rarity.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">
              #{agent.nftId}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Agent信息 */}
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Agent 头像 */}
            <div className="relative">
              <div 
                className="absolute inset-0 blur-xl rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: rarity.color,
                  opacity: isHovered ? 0.6 : 0.3,
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                }}
              />
              <div 
                className="relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${rarity.color}30, ${rarity.color}50)`,
                  border: `2px solid ${rarity.color}`
                }}
              >
                <PixelAgent agent={agent} size={44} />
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white">{agent.name}</h4>
              
              {/* 核心数据 - 图标化 */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1" title="余额">
                  <Wallet className="w-3.5 h-3.5 text-luxury-gold" />
                  <span className="text-sm font-mono text-white">{agent.balance.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1" title="利润">
                  <TrendingUp className={`w-3.5 h-3.5 ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`} />
                  <span className={`text-sm font-mono ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                    {agent.netProfit >= 0 ? '+' : ''}{agent.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 场次和胜率 - 同一行 */}
          <div className="flex items-center justify-between bg-void-light/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-1.5" title="总场次">
              <Swords className="w-4 h-4 text-luxury-cyan" />
              <span className="text-sm font-mono text-white">{agent.totalBattles}</span>
            </div>
            <div className="flex items-center gap-1.5" title="胜率">
              <Target className={`w-4 h-4 ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`} />
              <span className={`text-sm font-mono ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`}>
                {agent.winRate}%
              </span>
            </div>
            <div className="flex items-center gap-1.5" title="锦标赛冠军">
              <Trophy className="w-4 h-4 text-luxury-gold" />
              <span className="text-sm font-mono text-luxury-gold">{agent.tournamentWins}</span>
            </div>
          </div>

          {/* 属性展示 - 紧凑 */}
          <div className="bg-void-light/10 rounded-xl p-3 mb-4">
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center" title="攻击">
                <Zap className="w-4 h-4 mx-auto text-luxury-rose mb-1" />
                <p className="text-xs font-mono text-luxury-rose">{agent.attack}</p>
              </div>
              <div className="text-center" title="防御">
                <Shield className="w-4 h-4 mx-auto text-luxury-cyan mb-1" />
                <p className="text-xs font-mono text-luxury-cyan">{agent.defense}</p>
              </div>
              <div className="text-center" title="暴击">
                <Flame className="w-4 h-4 mx-auto text-luxury-amber mb-1" />
                <p className="text-xs font-mono text-luxury-amber">{agent.crit}</p>
              </div>
              <div className="text-center" title="命中">
                <Crosshair className="w-4 h-4 mx-auto text-luxury-purple mb-1" />
                <p className="text-xs font-mono text-luxury-purple">{agent.hit}</p>
              </div>
              <div className="text-center" title="敏捷">
                <Wind className="w-4 h-4 mx-auto text-luxury-green mb-1" />
                <p className="text-xs font-mono text-luxury-green">{agent.agility}</p>
              </div>
            </div>
          </div>
          
          {/* 操作提示 */}
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <Info className="w-3 h-3" />
            <span>点击查看详情</span>
          </div>
        </div>
      </div>

      {/* 快速存取款按钮 - 卡片下方 */}
      {agent.status === 'idle' && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {showDepositInput ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="金额"
                className="w-20 px-2 py-1 text-xs bg-void-light border border-white/10 rounded text-white"
                autoFocus
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleDeposit(); }}
                className="px-2 py-1 text-xs bg-luxury-green/20 text-luxury-green rounded hover:bg-luxury-green/30"
              >
                确认
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDepositInput(false); setAmount(''); }}
                className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded hover:bg-white/20"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDepositInput(true); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-luxury-green/10 text-luxury-green rounded-lg hover:bg-luxury-green/20 transition-colors"
              title="存款"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>存款</span>
            </button>
          )}

          {showWithdrawInput ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="金额"
                className="w-20 px-2 py-1 text-xs bg-void-light border border-white/10 rounded text-white"
                autoFocus
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleWithdraw(); }}
                className="px-2 py-1 text-xs bg-luxury-amber/20 text-luxury-amber rounded hover:bg-luxury-amber/30"
              >
                确认
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowWithdrawInput(false); setAmount(''); }}
                className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded hover:bg-white/20"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowWithdrawInput(true); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-luxury-amber/10 text-luxury-amber rounded-lg hover:bg-luxury-amber/20 transition-colors"
              title="提款"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>提款</span>
            </button>
          )}
        </div>
      )}

      {/* 详情弹窗 */}
      <AgentDetailModal 
        agent={agent} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </>
  );
};

export default AgentCard;
