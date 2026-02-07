import React from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../types';
import { Sparkles, Shield, Sword, Zap, Crown } from 'lucide-react';

interface NFTCardProps {
  agent: Agent;
  index?: number;
}

const rarityConfig: Record<string, {
  label: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  glowColor: string;
  icon: React.ElementType | null;
}> = {
  common: {
    label: 'COMMON',
    color: '#9ca3af',
    bgGradient: 'from-gray-500/20 to-gray-600/10',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20',
    icon: null
  },
  rare: {
    label: 'RARE',
    color: '#22d3ee',
    bgGradient: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/30',
    icon: Zap
  },
  epic: {
    label: 'EPIC',
    color: '#a855f7',
    bgGradient: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/30',
    icon: Sparkles
  },
  legendary: {
    label: 'LEGENDARY',
    color: '#fbbf24',
    bgGradient: 'from-amber-500/30 to-yellow-600/20',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/40',
    icon: Crown
  },
  mythic: {
    label: 'MYTHIC',
    color: '#f43f5e',
    bgGradient: 'from-rose-500/30 to-pink-600/20',
    borderColor: 'border-rose-500/50',
    glowColor: 'shadow-rose-500/40',
    icon: Crown
  }
};

const NFTCard: React.FC<NFTCardProps> = ({ agent, index = 0 }) => {
  const rarity = rarityConfig[agent.rarity] || rarityConfig.common;
  const RarityIcon = rarity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative aspect-[3/4] w-[180px]"
    >
      {/* 外发光 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGradient} blur-xl opacity-50 rounded-2xl`} />
      
      {/* 卡片主体 - 竖版比例 3:4 */}
      <div className={`relative w-full h-full bg-gradient-to-br from-void-panel to-void ${rarity.borderColor} border rounded-2xl overflow-hidden shadow-xl ${rarity.glowColor} flex flex-col`}>
        
        {/* 顶部稀有度条 */}
        <div className={`h-1 bg-gradient-to-r ${rarity.bgGradient}`} />
        
        {/* 头部信息 - 更紧凑 */}
        <div className="px-3 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            {RarityIcon && <RarityIcon className="w-3 h-3" style={{ color: rarity.color }} />}
            <span className="text-[10px] font-bold tracking-wider" style={{ color: rarity.color }}>
              {rarity.label}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            #{agent.nftId || agent.id.slice(-4).toUpperCase()}
          </span>
        </div>

        {/* NFT形象 - 使用NFT图片 */}
        <div className="flex-1 mx-3 mb-2 rounded-xl overflow-hidden relative min-h-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGradient} opacity-40`} />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {agent.image ? (
              <img 
                src={agent.image}
                alt={agent.name}
                className="w-full h-full max-w-[140px] max-h-[140px] rounded-xl object-cover"
                style={{ 
                  boxShadow: `0 0 40px ${agent.color}60, inset 0 0 20px rgba(255,255,255,0.1)`
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-full h-full max-w-[140px] max-h-[140px] rounded-xl"
                style={{ 
                  backgroundColor: agent.color,
                  boxShadow: `0 0 40px ${agent.color}60, inset 0 0 20px rgba(255,255,255,0.1)`
                }}
              >
                {/* 像素纹理 */}
                <div 
                  className="w-full h-full opacity-30 rounded-xl"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%),
                      linear-gradient(-45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%)
                    `,
                    backgroundSize: '8px 8px'
                  }}
                />
              </div>
            )}
          </div>
          {/* 角标 */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl" style={{ borderColor: rarity.color }} />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 rounded-tr" style={{ borderColor: rarity.color }} />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 rounded-bl" style={{ borderColor: rarity.color }} />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 rounded-br" style={{ borderColor: rarity.color }} />
        </div>

        {/* 属性 - 底部固定 */}
        <div className="px-3 pb-3 grid grid-cols-3 gap-1.5 shrink-0">
          <div className="flex flex-col items-center py-1.5 rounded-lg bg-white/5">
            <Sword className="w-3 h-3 text-luxury-rose mb-0.5" />
            <span className="text-sm font-bold text-white font-mono leading-none">{agent.attack}</span>
            <span className="text-[8px] text-white/40 mt-0.5">ATK</span>
          </div>
          <div className="flex flex-col items-center py-1.5 rounded-lg bg-white/5">
            <Shield className="w-3 h-3 text-luxury-cyan mb-0.5" />
            <span className="text-sm font-bold text-white font-mono leading-none">{agent.defense}</span>
            <span className="text-[8px] text-white/40 mt-0.5">DEF</span>
          </div>
          <div className="flex flex-col items-center py-1.5 rounded-lg bg-white/5">
            <Zap className="w-3 h-3 text-luxury-gold mb-0.5" />
            <span className="text-sm font-bold text-white font-mono leading-none">{agent.speed}</span>
            <span className="text-[8px] text-white/40 mt-0.5">SPD</span>
          </div>
        </div>

        {/* 闪光 */}
        {(agent.rarity === 'legendary' || agent.rarity === 'mythic') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default NFTCard;
