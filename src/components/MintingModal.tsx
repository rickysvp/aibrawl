import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '../types';
import NFTCard from './NFTCard';
import NFTCardMobile from './NFTCardMobile';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMinting && mintedAgents.length > 0) {
      const timer = setTimeout(() => {
        setShowReveal(true);
        setCurrentIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isMinting) {
      setShowReveal(false);
    }
  }, [isMinting, mintedAgents]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mintedAgents.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < mintedAgents.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-void/95 backdrop-blur-xl"
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

        {/* NFT卡片展示 - 桌面端 */}
        {showReveal && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-4"
          >
            {/* NFT卡片网格 - 一行最多5个 */}
            <div className="flex flex-wrap justify-center gap-3 max-w-[1000px]">
              {mintedAgents.map((agent, index) => (
                <NFTCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>

            {/* 确认按钮 */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + mintedAgents.length * 0.05 }}
              onClick={onClose}
              className="mt-8 px-8 py-2.5 bg-gradient-to-r from-luxury-gold to-luxury-amber text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.3)]"
            >
              {t('common.confirm') || 'Confirm'}
            </motion.button>
          </motion.div>
        )}

        {/* NFT卡片展示 - 移动端轮播 */}
        {showReveal && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-4"
          >
            {/* 进度指示器 */}
            <div className="flex items-center gap-2 mb-6">
              {mintedAgents.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'bg-luxury-gold w-6' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* 卡片轮播区域 */}
            <div className="relative flex items-center justify-center w-full max-w-sm">
              {/* 左箭头 */}
              {mintedAgents.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-0 z-10 p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* 当前卡片 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <NFTCardMobile agent={mintedAgents[currentIndex]} />
                </motion.div>
              </AnimatePresence>

              {/* 右箭头 */}
              {mintedAgents.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-0 z-10 p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* 计数器 */}
            <div className="mt-4 text-white/40 text-sm">
              {currentIndex + 1} / {mintedAgents.length}
            </div>

            {/* 确认按钮 */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onClose}
              className="mt-6 px-8 py-2.5 bg-gradient-to-r from-luxury-gold to-luxury-amber text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.3)]"
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
