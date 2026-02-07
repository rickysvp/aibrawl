import React from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../types';
import { Sparkles, Shield, Sword, Zap, Crown } from 'lucide-react';

interface NFTCardMobileProps {
  agent: Agent;
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

const NFTCardMobile: React.FC<NFTCardMobileProps> = ({ agent }) => {
  const rarity = rarityConfig[agent.rarity] || rarityConfig.common;
  const RarityIcon = rarity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-[280px] aspect-[3/4]"
    >
      {/* 外发光 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGradient} blur-2xl opacity-60 rounded-3xl`} />
      
      {/* 卡片主体 - 竖版比例 3:4 */}
      <div className={`relative w-full h-full bg-gradient-to-br from-void-panel to-void ${rarity.borderColor} border-2 rounded-3xl overflow-hidden shadow-2xl ${rarity.glowColor} flex flex-col`}>
        
        {/* 顶部稀有度条 */}
        <div className={`h-1.5 bg-gradient-to-r ${rarity.bgGradient}`} />
        
        {/* 头部信息 */}
        <div className="px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            {RarityIcon && <RarityIcon className="w-4 h-4" style={{ color: rarity.color }} />}
            <span className="text-xs font-bold tracking-wider" style={{ color: rarity.color }}>
              {rarity.label}
            </span>
          </div>
          <span className="text-xs font-mono text-white/30">
            #{agent.nftId || agent.id.slice(-4).toUpperCase()}
          </span>
        </div>

        {/* NFT形象 - 占据主要空间 */}
        <div className="flex-1 mx-4 mb-3 rounded-2xl overflow-hidden relative min-h-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGradient} opacity-50`} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div 
              className="w-full h-full max-w-[200px] max-h-[200px] rounded-2xl"
              style={{ 
                backgroundColor: agent.color,
                boxShadow: `0 0 60px ${agent.color}60, inset 0 0 30px rgba(255,255,255,0.1)`
              }}
            >
              <div 
                className="w-full h-full opacity-30 rounded-2xl"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%),
                    linear-gradient(-45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%)
                  `,
                  backgroundSize: '10px 10px'
                }}
              />
            </div>
          </div>
          {/* 角标 */}
          <div className="absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: rarity.color }} />
          <div className="absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: rarity.color }} />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: rarity.color }} />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: rarity.color }} />
        </div>

        {/* 属性 */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2 shrink-0">
          <div className="flex flex-col items-center py-2 rounded-xl bg-white/5">
            <Sword className="w-4 h-4 text-luxury-rose mb-1" />
            <span className="text-lg font-bold text-white font-mono leading-none">{agent.attack}</span>
            <span className="text-[10px] text-white/40 mt-1">ATK</span>
          </div>
          <div className="flex flex-col items-center py-2 rounded-xl bg-white/5">
            <Shield className="w-4 h-4 text-luxury-cyan mb-1" />
            <span className="text-lg font-bold text-white font-mono leading-none">{agent.defense}</span>
            <span className="text-[10px] text-white/40 mt-1">DEF</span>
          </div>
          <div className="flex flex-col items-center py-2 rounded-xl bg-white/5">
            <Zap className="w-4 h-4 text-luxury-gold mb-1" />
            <span className="text-lg font-bold text-white font-mono leading-none">{agent.agility}</span>
            <span className="text-[10px] text-white/40 mt-1">AGI</span>
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

export default NFTCardMobile;
