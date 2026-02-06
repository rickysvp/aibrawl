import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '../types';
import AgentCard from './AgentCard';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MintingModalProps {
  isOpen: boolean;
  isMinting: boolean;
  mintedAgents: Agent[];
  onClose: () => void;
}

const MintingModal: React.FC<MintingModalProps> = ({ isOpen, isMinting, mintedAgents, onClose }) => {
  const { t } = useTranslation();
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (!isMinting && mintedAgents.length > 0) {
      // 铸造完成，延迟一点显示结果，让铸造动画跑完
      const timer = setTimeout(() => {
        setShowReveal(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isMinting) {
      setShowReveal(false);
    }
  }, [isMinting, mintedAgents]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-xl"
      >
        {/* 铸造中动画 */}
        {!showReveal && (
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-8">
              {/* 核心能量球 */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                  filter: [
                    'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))',
                    'drop-shadow(0 0 50px rgba(6, 182, 212, 0.8))',
                    'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-luxury-purple via-void to-luxury-cyan opacity-80"
              />
              
              {/* 环绕轨道 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] rounded-full border-2 border-luxury-gold/30 border-t-luxury-gold border-r-transparent"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-40px] rounded-full border border-luxury-cyan/20 border-b-luxury-cyan border-l-transparent"
              />
              
              {/* 中心图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-white animate-pulse" />
              </div>
            </div>
            
            <motion.h2
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-luxury-purple to-luxury-cyan font-display"
            >
              {t('squad.minting') || 'Minting'}...
            </motion.h2>
            <p className="text-white/40 mt-2">{t('squad.summoningAgents') || 'Summoning Agents from the Void...'}</p>
          </div>
        )}

        {/* 结果展示 */}
        {showReveal && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-full max-w-6xl px-4 max-h-[90vh] overflow-y-auto flex flex-col items-center"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-white to-luxury-gold font-display mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                {t('squad.mintSuccess') || 'Mint Successful'}!
              </h2>
              <p className="text-xl text-white/60">{t('squad.newAgentsJoined') || 'New Agents have joined your squad'}</p>
            </motion.div>

            <div className={`grid gap-6 w-full ${
              mintedAgents.length === 1 ? 'grid-cols-1 max-w-sm' :
              mintedAgents.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl' :
              mintedAgents.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
              'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {mintedAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                  className="relative group"
                >
                  {/* 光效背景 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    agent.rarity === 'legendary' ? 'from-luxury-gold/50 to-luxury-purple/50' :
                    agent.rarity === 'epic' ? 'from-luxury-purple/50 to-luxury-cyan/50' :
                    agent.rarity === 'rare' ? 'from-luxury-cyan/50 to-luxury-green/50' :
                    'from-white/20 to-white/5'
                  } blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative transform transition-transform duration-300 hover:scale-105">
                    <AgentCard agent={agent} />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="mt-12 px-12 py-4 bg-gradient-to-r from-luxury-gold to-luxury-amber text-black font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.3)]"
            >
              {t('common.confirm') || 'Confirm'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MintingModal;
