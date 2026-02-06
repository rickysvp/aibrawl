import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  Clock,
  Users,
  Wallet,
  Plus,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  RefreshCw,
  Info,
  ArrowLeft
} from 'lucide-react';

const LiquidityMining: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    wallet,
    liquidityPool,
    userStakes,
    stakeLiquidity,
    unstakeLiquidity,
    claimLiquidityRewards,
    calculateRewards,
    connectWallet
  } = useGameStore();

  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [isStaking, setIsStaking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStakeId, setSelectedStakeId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 计算总质押和总收益
  const totalStaked = userStakes.reduce((sum, s) => sum + s.amount, 0);
  const totalPendingRewards = userStakes.reduce((sum, s) => sum + calculateRewards(s), 0);

  // 显示Toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 处理质押
  const handleStake = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast(t('liquidity.invalidAmount'), 'error');
      return;
    }

    setIsStaking(true);
    const result = stakeLiquidity(amount);
    setIsStaking(false);

    if (result.success) {
      showToast(result.message, 'success');
      setStakeAmount('');
    } else {
      showToast(result.message, 'error');
    }
  };

  // 处理解质押
  const handleUnstake = (stakeId: string) => {
    setSelectedStakeId(stakeId);
    setShowConfirmModal(true);
  };

  const confirmUnstake = () => {
    if (!selectedStakeId) return;

    const result = unstakeLiquidity(selectedStakeId);
    showToast(result.message, result.success ? 'success' : 'error');
    setShowConfirmModal(false);
    setSelectedStakeId(null);
  };

  // 处理领取收益
  const handleClaim = () => {
    const result = claimLiquidityRewards();
    showToast(result.message, result.success ? 'success' : 'error');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // 计算剩余锁仓时间
  const getRemainingLockTime = (unlockTime: number) => {
    const now = Date.now();
    const remaining = unlockTime - now;
    if (remaining <= 0) return t('liquidity.unlocked');

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `${days}d ${hours}h`;
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-void pt-24 pb-24">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('wallet.connectFirst')}</h2>
            <p className="text-white/40 mb-6">{t('liquidity.connectDesc')}</p>
            <button
              onClick={() => connectWallet('wallet')}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t('wallet.connectWallet')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/wallet')}
              className="w-12 h-12 rounded-2xl bg-void-light/50 border border-white/10 flex items-center justify-center hover:bg-void-light hover:border-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white/60" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-luxury-gold/20 to-luxury-amber/20 border border-luxury-gold/30 flex items-center justify-center">
              <Coins className="w-6 h-6 text-luxury-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-display">{t('liquidity.title')}</h1>
              <p className="text-white/40">{t('liquidity.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-purple/10 border border-luxury-purple/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-luxury-purple" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('liquidity.totalStaked')}</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{liquidityPool.totalStaked.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">$MON</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-luxury-gold" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('liquidity.apr')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-gold font-mono">{liquidityPool.apr.toFixed(2)}%</p>
            <p className="text-xs text-white/40 mt-1">{t('liquidity.dynamic')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-green/10 border border-luxury-green/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-luxury-green" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('liquidity.totalRewards')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-green font-mono">{liquidityPool.totalRewards.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">$MON</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-cyan/10 border border-luxury-cyan/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-luxury-cyan" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('liquidity.stakers')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-cyan font-mono">{liquidityPool.stakerCount}</p>
            <p className="text-xs text-white/40 mt-1">{t('liquidity.participants')}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 质押操作区 */}
          <div className="lg:col-span-1">
            <div className="card-luxury rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-luxury-purple" />
                {t('liquidity.stake')}
              </h3>

              <div className="mb-4">
                <label className="text-sm text-white/60 mb-2 block">{t('liquidity.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-luxury-purple focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">MON</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-white/40">
                    {t('liquidity.available')}: {wallet.balance.toLocaleString()} MON
                  </span>
                  <button
                    onClick={() => setStakeAmount(wallet.balance.toString())}
                    className="text-xs text-luxury-purple hover:text-luxury-purple-light"
                  >
                    {t('liquidity.max')}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-luxury-purple/5 rounded-xl border border-luxury-purple/20 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-luxury-purple" />
                  <span className="text-sm text-white/80">{t('liquidity.stakeInfo')}</span>
                </div>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• {t('liquidity.minStake')}: 100 MON</li>
                  <li>• {t('liquidity.lockPeriod')}: 7 {t('liquidity.days')}</li>
                  <li>• {t('liquidity.earlyPenalty')}: 20%</li>
                </ul>
              </div>

              <button
                onClick={handleStake}
                disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) < 100}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isStaking ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  t('liquidity.confirmStake')
                )}
              </button>
            </div>

            {/* 我的质押统计 */}
            <div className="card-luxury rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('liquidity.myStats')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">{t('liquidity.myStaked')}</span>
                  <span className="text-white font-mono">{totalStaked.toLocaleString()} MON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">{t('liquidity.pendingRewards')}</span>
                  <span className="text-luxury-green font-mono">+{totalPendingRewards.toFixed(4)} MON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">{t('liquidity.stakeCount')}</span>
                  <span className="text-white font-mono">{userStakes.length}</span>
                </div>
                {totalPendingRewards > 0 && (
                  <button
                    onClick={handleClaim}
                    className="w-full py-2 rounded-lg bg-luxury-green/20 text-luxury-green border border-luxury-green/30 hover:bg-luxury-green/30 transition-colors"
                  >
                    {t('liquidity.claimRewards')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 我的质押列表 */}
          <div className="lg:col-span-2">
            <div className="card-luxury rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('liquidity.myStakes')}</h3>

              {userStakes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40">{t('liquidity.noStakes')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userStakes.map((stake) => {
                    const pendingReward = calculateRewards(stake);
                    const isLocked = Date.now() < stake.unlockTime;

                    return (
                      <motion.div
                        key={stake.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-void-light/30 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isLocked ? 'bg-luxury-amber/10 border border-luxury-amber/20' : 'bg-luxury-green/10 border border-luxury-green/20'
                            }`}>
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-luxury-amber" />
                              ) : (
                                <Unlock className="w-5 h-5 text-luxury-green" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{stake.amount.toLocaleString()} MON</p>
                              <p className="text-xs text-white/40">
                                {t('liquidity.stakedAt')}: {formatTime(stake.stakedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-luxury-green text-sm">+{pendingReward.toFixed(4)} MON</p>
                            <p className="text-xs text-white/40">
                              {isLocked ? (
                                <span className="text-luxury-amber">{getRemainingLockTime(stake.unlockTime)}</span>
                              ) : (
                                <span className="text-luxury-green">{t('liquidity.unlocked')}</span>
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() => handleUnstake(stake.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isLocked
                                ? 'bg-luxury-amber/20 text-luxury-amber hover:bg-luxury-amber/30'
                                : 'bg-luxury-green/20 text-luxury-green hover:bg-luxury-green/30'
                            }`}
                          >
                            {isLocked ? t('liquidity.unstakeEarly') : t('liquidity.unstake')}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 收益说明 */}
            <div className="card-luxury rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-luxury-cyan" />
                {t('liquidity.howItWorks')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-void-light/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-luxury-purple/20 flex items-center justify-center mb-2">
                    <Plus className="w-4 h-4 text-luxury-purple" />
                  </div>
                  <h4 className="text-white font-medium mb-1">{t('liquidity.step1')}</h4>
                  <p className="text-xs text-white/50">{t('liquidity.step1Desc')}</p>
                </div>
                <div className="p-4 bg-void-light/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold/20 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <h4 className="text-white font-medium mb-1">{t('liquidity.step2')}</h4>
                  <p className="text-xs text-white/50">{t('liquidity.step2Desc')}</p>
                </div>
                <div className="p-4 bg-void-light/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-luxury-green/20 flex items-center justify-center mb-2">
                    <Coins className="w-4 h-4 text-luxury-green" />
                  </div>
                  <h4 className="text-white font-medium mb-1">{t('liquidity.step3')}</h4>
                  <p className="text-xs text-white/50">{t('liquidity.step3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 确认弹窗 */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-void-panel rounded-2xl w-full max-w-md p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-luxury-amber/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-luxury-amber" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('liquidity.confirmUnstake')}</h3>
                </div>

                <p className="text-white/60 mb-4">{t('liquidity.earlyUnstakeWarning')}</p>

                <div className="p-4 bg-luxury-amber/5 rounded-xl border border-luxury-amber/20 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60">{t('liquidity.penalty')}</span>
                    <span className="text-luxury-amber">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">{t('liquidity.youWillReceive')}</span>
                    <span className="text-luxury-green">
                      {selectedStakeId && (
                        (userStakes.find(s => s.id === selectedStakeId)?.amount || 0) * 0.8
                      ).toFixed(2)} MON
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={confirmUnstake}
                    className="flex-1 py-3 rounded-xl bg-luxury-amber text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t('liquidity.confirm')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl flex items-center gap-2 z-50 ${
                toast.type === 'success' ? 'bg-luxury-green/90' : 'bg-luxury-rose/90'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
              <span className="text-white font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiquidityMining;