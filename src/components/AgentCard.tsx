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
  Wind,
  Sparkles,
  Gem,
  Swords,
  TrendingUp,
  Wallet,
  Info,
  LogOut
} from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  viewMode?: 'card' | 'list';
}

// 稀有度配置
const rarityConfig: Record<Rarity, { name: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType; glowColor: string }> = {
  common: { 
    name: '普通', 
    color: '#9ca3af', 
    bgColor: 'bg-gray-500/10', 
    borderColor: 'border-gray-500/30',
    icon: Sparkles,
    glowColor: 'rgba(156, 163, 175, 0.4)'
  },
  rare: { 
    name: '稀有', 
    color: '#3b82f6', 
    bgColor: 'bg-blue-500/10', 
    borderColor: 'border-blue-500/30',
    icon: Gem,
    glowColor: 'rgba(59, 130, 246, 0.4)'
  },
  epic: { 
    name: '史诗', 
    color: '#a855f7', 
    bgColor: 'bg-purple-500/10', 
    borderColor: 'border-purple-500/30',
    icon: Zap,
    glowColor: 'rgba(168, 85, 247, 0.5)'
  },
  legendary: { 
    name: '传说', 
    color: '#f59e0b', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/30',
    icon: Trophy,
    glowColor: 'rgba(245, 158, 11, 0.5)'
  },
  mythic: { 
    name: '神话', 
    color: '#ef4444', 
    bgColor: 'bg-red-500/10', 
    borderColor: 'border-red-500/30',
    icon: Flame,
    glowColor: 'rgba(239, 68, 68, 0.5)'
  },
};

const AgentCard: React.FC<AgentCardProps> = ({ agent, compact = false, viewMode = 'card' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { joinArena, leaveArena } = useGameStore();
  
  const getStatusConfig = () => {
    switch (agent.status) {
      case 'idle': 
        return { 
          label: '空闲', 
          color: 'text-luxury-cyan',
          bgColor: 'bg-luxury-cyan/10',
          borderColor: 'border-luxury-cyan/30',
          dotColor: 'bg-luxury-cyan'
        };
      case 'in_arena': 
        return { 
          label: '待战', 
          color: 'text-luxury-gold',
          bgColor: 'bg-luxury-gold/10',
          borderColor: 'border-luxury-gold/30',
          dotColor: 'bg-luxury-gold'
        };
      case 'fighting': 
        return { 
          label: '战斗中', 
          color: 'text-luxury-rose',
          bgColor: 'bg-luxury-rose/10',
          borderColor: 'border-luxury-rose/30',
          dotColor: 'bg-luxury-rose'
        };
      case 'eliminated': 
        return { 
          label: '已淘汰', 
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          dotColor: 'bg-gray-500'
        };
      default: 
        return { 
          label: '未知', 
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/30',
          dotColor: 'bg-gray-400'
        };
    }
  };
  
  const status = getStatusConfig();
  const rarity = rarityConfig[agent.rarity] || rarityConfig['common'];
  const RarityIcon = rarity?.icon || Sparkles;

  // Compact列表视图 - 用于首页我的小队模块
  if (compact && viewMode === 'list') {
    return (
      <>
        <div 
          className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all cursor-pointer group"
          onClick={() => setIsDetailOpen(true)}
        >
          {/* Agent 头像 */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-9 h-9 rounded-lg overflow-hidden border-2"
              style={{ borderColor: rarity.color }}
            >
              {agent.image ? (
                <img 
                  src={agent.image} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-black/30 flex items-center justify-center">
                   <PixelAgent agent={agent} size={20} />
                </div>
              )}
            </div>
            {/* 状态指示器 */}
            <div 
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-void ${status.dotColor}`}
            />
          </div>
          
          {/* 主要信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-medium text-white text-sm truncate">{agent.name}</span>
              <span className="text-[10px] text-white/30 font-mono">#{agent.nftId}</span>
            </div>
            {/* 余额和盈利 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-luxury-gold">
                ${agent.balance.toLocaleString()}
              </span>
              <span className={`text-[10px] font-mono ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                {agent.netProfit >= 0 ? '+' : ''}{agent.netProfit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            {/* 有余额且在idle/eliminated状态 - 显示加入竞技场按钮 */}
            {(agent.status === 'idle' || agent.status === 'eliminated') && agent.balance > 0 && (
              <button
                onClick={() => joinArena(agent.id)}
                className="p-1.5 rounded-lg bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold transition-colors"
                title="加入竞技场"
              >
                <Swords className="w-3.5 h-3.5" />
              </button>
            )}
            {/* 有余额且在in_arena状态 - 显示退出竞技场按钮 */}
            {agent.status === 'in_arena' && agent.balance > 0 && (
              <button
                onClick={() => leaveArena(agent.id)}
                className="p-1.5 rounded-lg bg-luxury-rose/10 hover:bg-luxury-rose/20 text-luxury-rose transition-colors"
                title="退出竞技场"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            {/* 战斗中状态 */}
            {agent.status === 'fighting' && (
              <span className="text-[10px] text-luxury-rose">战斗中</span>
            )}
            {/* 无余额状态 - 显示充值按钮 */}
            {agent.balance <= 0 && (
              <span className="text-[10px] text-gray-500">已淘汰</span>
            )}
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

  // Compact卡片视图
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
                  {agent.image ? (
                    <img 
                      src={agent.image} 
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PixelAgent agent={agent} size={36} />
                  )}
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

  // 列表视图 - 重新设计
  if (viewMode === 'list') {
    return (
      <>
        <div 
          className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all cursor-pointer group"
          onClick={() => setIsDetailOpen(true)}
        >
          {/* Agent 头像 - 带余额标签 */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-10 h-10 rounded-lg overflow-hidden border-2"
              style={{ borderColor: rarity.color }}
            >
              {agent.image ? (
                <img 
                  src={agent.image} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-black/30 flex items-center justify-center">
                   <PixelAgent agent={agent} size={24} />
                </div>
              )}
            </div>
            {/* 状态指示器 */}
            <div 
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-void ${status.dotColor}`}
            />
          </div>
          
          {/* 主要信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-white text-sm truncate">{agent.name}</span>
              <span className="text-[10px] text-white/30 font-mono">#{agent.nftId}</span>
            </div>
            {/* 余额和盈利并排 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-luxury-gold/70" />
                <span className="text-xs font-mono font-semibold text-luxury-gold">
                  {agent.balance.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-3 h-3 ${agent.netProfit >= 0 ? 'text-luxury-green/70' : 'text-luxury-rose/70'}`} />
                <span className={`text-xs font-mono font-medium ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                  {agent.netProfit >= 0 ? '+' : ''}{agent.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 胜率和操作 */}
          <div className="flex items-center gap-3">
            {/* 胜率 */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 justify-end">
                <Target className="w-3 h-3 text-white/40" />
                <span className={`text-xs font-mono font-semibold ${
                  agent.winRate >= 60 ? 'text-luxury-green' : 
                  agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'
                }`}>
                  {agent.winRate}%
                </span>
              </div>
              <p className="text-[10px] text-white/30">{agent.totalBattles}场</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center">
              {/* 有余额且在idle/eliminated状态 - 显示加入竞技场按钮 */}
              {(agent.status === 'idle' || agent.status === 'eliminated') && agent.balance > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); joinArena(agent.id); }}
                  className="p-2 rounded-lg bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold transition-colors"
                  title="加入竞技场"
                >
                  <Swords className="w-4 h-4" />
                </button>
              )}
              {/* 有余额且在in_arena状态 - 显示退出竞技场按钮 */}
              {agent.status === 'in_arena' && agent.balance > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); leaveArena(agent.id); }}
                  className="p-2 rounded-lg bg-luxury-rose/10 hover:bg-luxury-rose/20 text-luxury-rose transition-colors"
                  title="退出竞技场"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
              {/* 战斗中状态 */}
              {agent.status === 'fighting' && (
                <span className="px-2 py-1 rounded-lg bg-luxury-rose/10 text-luxury-rose text-xs font-medium">
                  战斗中
                </span>
              )}
              {/* 无余额状态 - 显示已淘汰 */}
              {agent.balance <= 0 && (
                <span className="px-2 py-1 rounded-lg bg-gray-500/10 text-gray-500 text-xs font-medium">
                  已淘汰
                </span>
              )}
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
        className="card-luxury rounded-2xl overflow-hidden group cursor-pointer relative"
        onClick={() => setIsDetailOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderColor: isHovered ? rarity.color : 'rgba(255, 255, 255, 0.05)',
          borderWidth: isHovered ? '2px' : '1px',
          boxShadow: isHovered ? `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px ${rarity.glowColor}` : undefined,
        }}
      >
        {/* 顶部信息条 - 显示余额 */}
        <div 
          className="px-4 py-2 flex items-center justify-between"
          style={{ 
            background: `linear-gradient(90deg, ${rarity.color}25, ${rarity.color}08)`,
            borderBottom: `1px solid ${rarity.color}30`
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${rarity.color}30` }}
            >
              <RarityIcon className="w-3.5 h-3.5" style={{ color: rarity.color }} />
            </div>
            <span className="text-xs text-luxury-gold font-mono font-semibold">
              ${agent.balance.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-mono">
              #{agent.nftId}
            </span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bgColor} ${status.borderColor} border`}>
              <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor} ${agent.status === 'fighting' ? 'animate-pulse' : ''}`} />
              <span className={`text-[10px] font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Agent信息 */}
        <div className="p-4">
          {/* 头部：头像 + 名称 */}
          <div className="flex items-start gap-4 mb-4">
            {/* Agent 头像 */}
            <div className="relative flex-shrink-0">
              <div 
                className="absolute inset-0 blur-2xl rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: rarity.color,
                  opacity: isHovered ? 0.7 : 0.4,
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                }}
              />
              <div 
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${rarity.color}40, ${rarity.color}60)`,
                  border: `2px solid ${rarity.color}`,
                  boxShadow: `0 0 20px ${rarity.glowColor}`
                }}
              >
                {agent.image ? (
                  <img 
                    src={agent.image} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('[AgentCard] Image failed to load:', agent.image);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.pixel-fallback')?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <PixelAgent agent={agent} size={48} />
                )}
                {/* 图片加载失败时的备用显示 */}
                <div className="pixel-fallback hidden absolute inset-0 flex items-center justify-center">
                  <PixelAgent agent={agent} size={48} />
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-white truncate mb-2">{agent.name}</h4>
              
              {/* 余额和盈亏 */}
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
                  style={{ 
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderColor: 'rgba(255, 215, 0, 0.25)'
                  }}
                  title="钱包余额"
                >
                  <Wallet className="w-3.5 h-3.5 text-luxury-gold" />
                  <span className="text-sm font-mono font-bold text-luxury-gold">{agent.balance.toLocaleString()}</span>
                </div>
                <div 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${agent.netProfit >= 0 ? 'bg-luxury-green/10 border-luxury-green/25' : 'bg-luxury-rose/10 border-luxury-rose/25'}`}
                  title="累计盈亏"
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`} />
                  <span className={`text-sm font-mono font-bold ${agent.netProfit >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                    {agent.netProfit >= 0 ? '+' : ''}{agent.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 关键战绩数据 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div 
              className="rounded-xl p-3 text-center border transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                borderColor: 'rgba(6, 182, 212, 0.2)'
              }}
              title="参与场数"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Swords className="w-3.5 h-3.5 text-luxury-cyan" />
              </div>
              <span className="text-xl font-mono font-bold text-white">{agent.totalBattles}</span>
              <p className="text-[10px] text-white/40 mt-0.5">场数</p>
            </div>
            <div 
              className="rounded-xl p-3 text-center border transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: agent.winRate >= 60 ? 'rgba(34, 197, 94, 0.08)' : agent.winRate >= 40 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                borderColor: agent.winRate >= 60 ? 'rgba(34, 197, 94, 0.2)' : agent.winRate >= 40 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)'
              }}
              title="胜率"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className={`w-3.5 h-3.5 ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`} />
              </div>
              <span className={`text-xl font-mono font-bold ${agent.winRate >= 60 ? 'text-luxury-green' : agent.winRate >= 40 ? 'text-luxury-amber' : 'text-luxury-rose'}`}>
                {agent.winRate}%
              </span>
              <p className="text-[10px] text-white/40 mt-0.5">胜率</p>
            </div>
            <div 
              className="rounded-xl p-3 text-center border transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(255, 215, 0, 0.08)',
                borderColor: 'rgba(255, 215, 0, 0.2)'
              }}
              title="锦标赛冠军"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5 text-luxury-gold" />
              </div>
              <span className="text-xl font-mono font-bold text-luxury-gold">{agent.tournamentWins}</span>
              <p className="text-[10px] text-white/40 mt-0.5">冠军</p>
            </div>
          </div>

          {/* 属性展示 */}
          <div 
            className="rounded-xl p-3 border"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center group/stat" title="攻击">
                <div className="w-7 h-7 mx-auto rounded-lg bg-luxury-rose/10 flex items-center justify-center mb-1 group-hover/stat:bg-luxury-rose/20 transition-colors">
                  <Zap className="w-3.5 h-3.5 text-luxury-rose" />
                </div>
                <p className="text-sm font-mono font-bold text-luxury-rose">{agent.attack}</p>
              </div>
              <div className="text-center group/stat" title="防御">
                <div className="w-7 h-7 mx-auto rounded-lg bg-luxury-cyan/10 flex items-center justify-center mb-1 group-hover/stat:bg-luxury-cyan/20 transition-colors">
                  <Shield className="w-3.5 h-3.5 text-luxury-cyan" />
                </div>
                <p className="text-sm font-mono font-bold text-luxury-cyan">{agent.defense}</p>
              </div>
              <div className="text-center group/stat" title="暴击率">
                <div className="w-7 h-7 mx-auto rounded-lg bg-luxury-amber/10 flex items-center justify-center mb-1 group-hover/stat:bg-luxury-amber/20 transition-colors">
                  <Flame className="w-3.5 h-3.5 text-luxury-amber" />
                </div>
                <p className="text-sm font-mono font-bold text-luxury-amber">{agent.critRate}</p>
              </div>
              <div className="text-center group/stat" title="速度">
                <div className="w-7 h-7 mx-auto rounded-lg bg-luxury-green/10 flex items-center justify-center mb-1 group-hover/stat:bg-luxury-green/20 transition-colors">
                  <Wind className="w-3.5 h-3.5 text-luxury-green" />
                </div>
                <p className="text-sm font-mono font-bold text-luxury-green">{agent.speed}</p>
              </div>
              <div className="text-center group/stat" title="幸运">
                <div className="w-7 h-7 mx-auto rounded-lg bg-luxury-purple/10 flex items-center justify-center mb-1 group-hover/stat:bg-luxury-purple/20 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-luxury-purple" />
                </div>
                <p className="text-sm font-mono font-bold text-luxury-purple">{agent.luck}</p>
              </div>
            </div>
          </div>
          
          {/* 底部操作提示 */}
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs mt-3">
            <Info className="w-3 h-3" />
            <span>点击查看详情</span>
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
};

export default AgentCard;
