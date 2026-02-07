import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Trophy,
  TrendingUp,
  Clock,
  Wallet,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import type { PredictionMarket, AutoBetRule } from '../types';

const PredictionMarketPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    wallet,
    predictionMarkets,
    userPredictions,
    placePredictionBet,
    setAutoBetRule,
    systemAgents,
    connectWallet
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'markets' | 'myBets' | 'auto'>('markets');
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showBetModal, setShowBetModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [autoBetSettings, setAutoBetSettings] = useState<AutoBetRule>({
    enabled: false,
    betAmount: 100,
    strategy: 'always',
    maxBetsPerDay: 5,
    minOdds: 1.5,
    maxOdds: 5.0
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePlaceBet = () => {
    if (!selectedMarket || !selectedAgent || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 10) {
      showToast(t('prediction.minBetError'), 'error');
      return;
    }

    const result = placePredictionBet(selectedMarket.id, selectedAgent, amount, selectedMarket.betType);
    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      setShowBetModal(false);
      setBetAmount('');
      setSelectedAgent('');
    }
  };

  const openBetModal = (market: PredictionMarket, agentId: string) => {
    setSelectedMarket(market);
    setSelectedAgent(agentId);
    setBetAmount('');
    setShowBetModal(true);
  };

  const saveAutoBetSettings = () => {
    setAutoBetRule(autoBetSettings);
    showToast(t('prediction.autoBetSaved'), 'success');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return t('prediction.open');
      case 'closed': return t('prediction.closed');
      case 'settled': return t('prediction.settled');
      default: return status;
    }
  };

  const getBetTypeText = (type: string) => {
    switch (type) {
      case 'final': return t('prediction.final');
      case 'semifinal': return t('prediction.semifinal');
      case 'match': return t('prediction.match');
      default: return type;
    }
  };

  const openMarkets = predictionMarkets.filter(m => m.status === 'open');
  const myBets = userPredictions.filter(b => b.userId === wallet.address);

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


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-purple/10 border border-luxury-purple/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-luxury-purple" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('prediction.activeMarkets')}</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">{openMarkets.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-luxury-gold" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('prediction.totalPool')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-gold font-mono">
              {predictionMarkets.reduce((sum, m) => sum + m.totalPool, 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-1">MON</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-green/10 border border-luxury-green/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-luxury-green" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('prediction.myBets')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-green font-mono">{myBets.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-cyan/10 border border-luxury-cyan/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-luxury-cyan" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('prediction.winRate')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-cyan font-mono">
              {myBets.length > 0
                ? Math.round((myBets.filter(b => b.status === 'won').length / myBets.length) * 100)
                : 0}%
            </p>
          </motion.div>
        </div>

        <div className="flex items-center gap-1 relative bg-void-light/20 rounded-xl p-1 w-fit mb-6 isolate">
          <motion.div
            className="absolute inset-y-1 rounded-lg bg-luxury-rose/20 -z-10"
            initial={false}
            animate={{
              x: activeTab === 'markets' ? 4 : activeTab === 'myBets' ? 108 : 212,
              width: 100
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {['markets', 'myBets', 'auto'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t(`prediction.tab.${tab}`)}
            </button>
          ))}
        </div>

        {activeTab === 'markets' && (
          <div className="space-y-4">
            {openMarkets.length === 0 ? (
              <div className="card-luxury rounded-2xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40">{t('prediction.noMarkets')}</p>
              </div>
            ) : (
              openMarkets.map((market) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-luxury rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{market.name}</h3>
                      <p className="text-sm text-white/40">
                        {getBetTypeText(market.betType)} • {getStatusText(market.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-luxury-gold font-mono">{market.totalPool.toLocaleString()}</p>
                      <p className="text-xs text-white/40">MON {t('prediction.pool')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {systemAgents.slice(0, 8).map((agent) => {
                      const odds = market.odds[agent.id] || 2.0;
                      return (
                        <motion.button
                          key={agent.id}
                          onClick={() => openBetModal(market, agent.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-3 bg-void-light/30 rounded-xl border border-white/5 hover:border-luxury-rose/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-8 h-8 rounded-lg"
                              style={{ backgroundColor: agent.color }}
                            />
                            <span className="text-sm text-white truncate">{agent.name}</span>
                          </div>
                          <p className="text-lg font-bold text-luxury-gold">{odds.toFixed(2)}x</p>
                          <p className="text-xs text-white/40">{t('prediction.odds')}</p>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-white/40">
                    <span>{t('prediction.deadline')}: {new Date(market.deadline).toLocaleString()}</span>
                    <span>{market.participants.length} {t('prediction.participants')}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'myBets' && (
          <div className="space-y-3">
            {myBets.length === 0 ? (
              <div className="card-luxury rounded-2xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40">{t('prediction.noBets')}</p>
              </div>
            ) : (
              myBets.map((bet) => (
                <motion.div
                  key={bet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-void-light/30 rounded-xl border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bet.status === 'won' ? 'bg-luxury-green/10 border border-luxury-green/20' :
                        bet.status === 'lost' ? 'bg-luxury-rose/10 border border-luxury-rose/20' :
                        'bg-luxury-amber/10 border border-luxury-amber/20'
                      }`}>
                        {bet.status === 'won' ? <CheckCircle className="w-5 h-5 text-luxury-green" /> :
                         bet.status === 'lost' ? <AlertCircle className="w-5 h-5 text-luxury-rose" /> :
                         <Clock className="w-5 h-5 text-luxury-amber" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{getBetTypeText(bet.betType)}</p>
                        <p className="text-xs text-white/40">
                          {bet.betAmount.toLocaleString()} MON @ {bet.odds.toFixed(2)}x
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-mono ${
                        bet.status === 'won' ? 'text-luxury-green' :
                        bet.status === 'lost' ? 'text-luxury-rose' :
                        'text-luxury-amber'
                      }`}>
                        {bet.status === 'won' ? `+${bet.potentialWin.toLocaleString()}` :
                         bet.status === 'lost' ? `-${bet.betAmount.toLocaleString()}` :
                         t('prediction.pending')}
                      </p>
                      <p className="text-xs text-white/40">MON</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="card-luxury rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-luxury-cyan" />
              {t('prediction.autoBetSettings')}
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-void-light/30 rounded-xl">
                <div>
                  <p className="text-white font-medium">{t('prediction.enableAutoBet')}</p>
                  <p className="text-sm text-white/40">{t('prediction.autoBetDesc')}</p>
                </div>
                <button
                  onClick={() => setAutoBetSettings({ ...autoBetSettings, enabled: !autoBetSettings.enabled })}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    autoBetSettings.enabled ? 'bg-luxury-green' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white absolute top-1"
                    animate={{ left: autoBetSettings.enabled ? '32px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">{t('prediction.betAmount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={autoBetSettings.betAmount}
                    onChange={(e) => setAutoBetSettings({ ...autoBetSettings, betAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-cyan focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">MON</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">{t('prediction.strategy')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['always', 'top_ranked', 'specified'].map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setAutoBetSettings({ ...autoBetSettings, strategy: strategy as any })}
                      className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                        autoBetSettings.strategy === strategy
                          ? 'bg-luxury-cyan/20 text-luxury-cyan border border-luxury-cyan/30'
                          : 'bg-void-light/30 text-white/60 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {t(`prediction.strategy.${strategy}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">{t('prediction.maxBetsPerDay')}</label>
                <input
                  type="number"
                  value={autoBetSettings.maxBetsPerDay}
                  onChange={(e) => setAutoBetSettings({ ...autoBetSettings, maxBetsPerDay: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={20}
                  className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-cyan focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('prediction.minOdds')}</label>
                  <input
                    type="number"
                    value={autoBetSettings.minOdds}
                    onChange={(e) => setAutoBetSettings({ ...autoBetSettings, minOdds: parseFloat(e.target.value) || 1 })}
                    step={0.1}
                    min={1}
                    className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-cyan focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('prediction.maxOdds')}</label>
                  <input
                    type="number"
                    value={autoBetSettings.maxOdds}
                    onChange={(e) => setAutoBetSettings({ ...autoBetSettings, maxOdds: parseFloat(e.target.value) || 10 })}
                    step={0.1}
                    min={1}
                    className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-cyan focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={saveAutoBetSettings}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-luxury-cyan to-luxury-purple text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {t('prediction.saveSettings')}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showBetModal && selectedMarket && (
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
                <h3 className="text-xl font-bold text-white mb-4">{t('prediction.placeBet')}</h3>

                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-2 block">{t('prediction.amount')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-void-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-luxury-rose focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">MON</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-white/40">
                      {t('prediction.available')}: {wallet.balance.toLocaleString()} MON
                    </span>
                    <button
                      onClick={() => setBetAmount(wallet.balance.toString())}
                      className="text-xs text-luxury-rose hover:text-luxury-rose-light"
                    >
                      {t('prediction.max')}
                    </button>
                  </div>
                </div>

                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="p-4 bg-luxury-rose/5 rounded-xl border border-luxury-rose/20 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-white/60">{t('prediction.odds')}</span>
                      <span className="text-luxury-gold">{selectedMarket.odds[selectedAgent]?.toFixed(2) || '2.00'}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">{t('prediction.potentialWin')}</span>
                      <span className="text-luxury-green">
                        {(parseFloat(betAmount) * (selectedMarket.odds[selectedAgent] || 2)).toFixed(2)} MON
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBetModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handlePlaceBet}
                    disabled={!betAmount || parseFloat(betAmount) < 10}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-luxury-rose to-luxury-purple text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {t('prediction.confirmBet')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

export default PredictionMarketPage;
