import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import TournamentBracket from '../components/TournamentBracket';
import type { Tournament as TournamentType } from '../types';
import {
  Trophy,
  Clock,
  Users,
  Wallet,
  ChevronRight,
  Star,
  Zap,
  Target,
  Calendar,
  History,
  Settings,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';

const Tournament: React.FC = () => {
  const { t } = useTranslation();
  const {
    wallet,
    tournaments,
    tournamentEntries,
    tournamentHistory,
    tournamentAutoSettings,
    registerForTournament,
    setTournamentAutoSettings,
    getQualifiedAgentsForTournament,
    connectWallet
  } = useGameStore();

  const [selectedTournament, setSelectedTournament] = useState<TournamentType | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showAutoSettingsModal, setShowAutoSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'challenge' | 'daily' | 'weekly'>('all');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusConfig = (status: TournamentType['status']) => {
    switch (status) {
      case 'ongoing':
        return {
          label: t('tournament.ongoing'),
          color: 'text-luxury-green',
          bgColor: 'bg-luxury-green/10',
          borderColor: 'border-luxury-green/20',
          badge: 'bg-luxury-green'
        };
      case 'registration':
        return {
          label: t('tournament.registration'),
          color: 'text-luxury-amber',
          bgColor: 'bg-luxury-amber/10',
          borderColor: 'border-luxury-amber/20',
          badge: 'bg-luxury-amber'
        };
      case 'upcoming':
        return {
          label: t('tournament.upcoming'),
          color: 'text-luxury-cyan',
          bgColor: 'bg-luxury-cyan/10',
          borderColor: 'border-luxury-cyan/20',
          badge: 'bg-luxury-cyan'
        };
      case 'finished':
        return {
          label: t('tournament.ended'),
          color: 'text-white/40',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/10',
          badge: 'bg-white/20'
        };
    }
  };

  const getTypeConfig = (type: TournamentType['type']) => {
    switch (type) {
      case 'challenge':
        return {
          label: t('tournament.challenge'),
          icon: Zap,
          color: 'text-luxury-cyan',
          bgColor: 'bg-luxury-cyan/10',
          borderColor: 'border-luxury-cyan/20'
        };
      case 'daily':
        return {
          label: t('tournament.daily'),
          icon: Calendar,
          color: 'text-luxury-purple',
          bgColor: 'bg-luxury-purple/10',
          borderColor: 'border-luxury-purple/20'
        };
      case 'weekly':
        return {
          label: t('tournament.weekly'),
          icon: Crown,
          color: 'text-luxury-gold',
          bgColor: 'bg-luxury-gold/10',
          borderColor: 'border-luxury-gold/20'
        };
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return t('tournament.started');

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleRegister = () => {
    if (!selectedTournament || !selectedAgentId) return;

    const result = registerForTournament(selectedTournament.id, selectedAgentId);
    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      setShowRegistrationModal(false);
      setSelectedAgentId('');
    }
  };

  const openRegistrationModal = (tournament: TournamentType) => {
    setSelectedTournament(tournament);
    setSelectedAgentId('');
    setShowRegistrationModal(true);
  };

  const openBracketModal = (tournament: TournamentType) => {
    setSelectedTournament(tournament);
    setShowBracketModal(true);
  };

  const saveAutoSettings = () => {
    showToast(t('tournament.autoSettingsSaved'), 'success');
    setShowAutoSettingsModal(false);
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  const getMyEntry = (tournamentId: string) => {
    return tournamentEntries.find(
      (e) => e.tournamentId === tournamentId && e.userId === wallet.address
    );
  };

  const isRegistered = (tournamentId: string) => {
    return !!getMyEntry(tournamentId);
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-luxury-gold/20 to-luxury-purple/20 border border-luxury-gold/30 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-luxury-gold" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('wallet.connectFirst')}</h2>
          <p className="text-white/40 mb-8">{t('wallet.connectDesc') || 'Please connect your wallet to continue'}</p>
          <button
            onClick={() => connectWallet('wallet')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-luxury-gold to-luxury-purple text-white font-semibold hover:opacity-90 transition-opacity"
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
              <div className="w-10 h-10 rounded-xl bg-luxury-green/10 border border-luxury-green/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-luxury-green" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('tournament.ongoing')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-green font-mono">
              {tournaments.filter((t) => t.status === 'ongoing').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-cyan/10 border border-luxury-cyan/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-luxury-cyan" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('tournament.upcoming')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-cyan font-mono">
              {tournaments.filter((t) => t.status === 'upcoming' || t.status === 'registration').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-luxury-gold" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('tournament.totalPrize')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-gold font-mono">
              {tournaments.reduce((sum, t) => sum + t.prizePool, 0).toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-1">MON</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-luxury rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-purple/10 border border-luxury-purple/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-luxury-purple" />
              </div>
              <span className="text-xs text-white/40 uppercase tracking-wider">{t('tournament.myEntries')}</span>
            </div>
            <p className="text-3xl font-bold text-luxury-purple font-mono">
              {tournamentEntries.filter((e) => e.userId === wallet.address).length}
            </p>
          </motion.div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: t('tournament.all'), icon: Trophy },
              { key: 'challenge', label: t('tournament.challenge'), icon: Zap },
              { key: 'daily', label: t('tournament.daily'), icon: Calendar },
              { key: 'weekly', label: t('tournament.weekly'), icon: Crown },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-luxury-purple/20 text-luxury-purple border border-luxury-purple/30'
                    : 'bg-void-light/30 text-white/60 border border-white/5 hover:border-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="p-2 rounded-xl bg-void-light/50 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
              title={t('tournament.history')}
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAutoSettingsModal(true)}
              className="p-2 rounded-xl bg-void-light/50 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
              title={t('tournament.autoSettings')}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTournaments.map((tournament, index) => {
            const status = getStatusConfig(tournament.status);
            const type = getTypeConfig(tournament.type);
            const TypeIcon = type.icon;
            const progress = (tournament.participants.length / tournament.maxParticipants) * 100;
            const registered = isRegistered(tournament.id);
            const myEntry = getMyEntry(tournament.id);

            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-luxury rounded-2xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-white/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${type.bgColor} ${type.borderColor} border flex items-center justify-center`}>
                        <TypeIcon className={`w-6 h-6 ${type.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{tournament.name}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`px-2 py-0.5 rounded ${status.bgColor} ${status.color} text-xs`}>
                            {status.label}
                          </span>
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(tournament.startTime)}
                          </span>
                          {tournament.status === 'upcoming' && (
                            <span className="text-luxury-cyan">{getTimeRemaining(tournament.startTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-luxury-gold font-mono">
                        {tournament.prizePool.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/40">MON {t('tournament.prizePool')}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-void-light/30 rounded-xl">
                      <p className="text-xs text-white/40 mb-1">{t('tournament.entryFee')}</p>
                      <p className="text-lg font-bold text-luxury-cyan font-mono">{tournament.entryFee}</p>
                    </div>
                    <div className="p-3 bg-void-light/30 rounded-xl">
                      <p className="text-xs text-white/40 mb-1">{t('tournament.participants')}</p>
                      <p className="text-lg font-bold text-white font-mono">
                        {tournament.participants.length}/{tournament.maxParticipants}
                      </p>
                    </div>
                    <div className="p-3 bg-void-light/30 rounded-xl">
                      <p className="text-xs text-white/40 mb-1">{t('tournament.currentRound')}</p>
                      <p className="text-lg font-bold text-luxury-purple">
                        {t(`tournament.round.${tournament.currentRound}`)}
                      </p>
                    </div>
                    <div className="p-3 bg-void-light/30 rounded-xl">
                      <p className="text-xs text-white/40 mb-1">{t('tournament.type')}</p>
                      <p className={`text-lg font-bold ${type.color}`}>{type.label}</p>
                    </div>
                  </div>

                  {tournament.status !== 'finished' && (
                    <div className="mb-4">
                      <div className="h-2 bg-void-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-luxury-purple to-luxury-cyan transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-white/40">{t('tournament.registrationProgress')}</span>
                        <span className="text-luxury-cyan font-mono">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {(tournament.status === 'upcoming' || tournament.status === 'registration') && (
                      <>
                        {registered ? (
                          <button
                            disabled
                            className="flex-1 py-3 rounded-xl bg-luxury-green/20 border border-luxury-green/30 text-luxury-green font-semibold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            {t('tournament.registered')}
                          </button>
                        ) : (
                          <button
                            onClick={() => openRegistrationModal(tournament)}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            {t('tournament.register')}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    {tournament.status === 'ongoing' && (
                      <button
                        onClick={() => openBracketModal(tournament)}
                        className="flex-1 py-3 rounded-xl bg-luxury-amber/10 border border-luxury-amber/30 text-luxury-amber font-semibold hover:bg-luxury-amber/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Target className="w-5 h-5" />
                        {t('tournament.viewBracket')}
                      </button>
                    )}
                    {tournament.status === 'finished' && (
                      <button
                        onClick={() => openBracketModal(tournament)}
                        className="flex-1 py-3 rounded-xl bg-void-light border border-white/10 text-white/60 font-semibold hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <History className="w-5 h-5" />
                        {t('tournament.viewResults')}
                      </button>
                    )}
                  </div>

                  {myEntry && (
                    <div className="mt-4 p-4 bg-luxury-purple/5 rounded-xl border border-luxury-purple/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg"
                            style={{ backgroundColor: myEntry.agent.color }}
                          />
                          <div>
                            <p className="text-white font-medium">{myEntry.agent.name}</p>
                            <p className="text-xs text-white/40">
                              {t('tournament.registeredAt')}: {formatTime(myEntry.registeredAt)}
                            </p>
                          </div>
                        </div>
                        {myEntry.finalRank && (
                          <div className="text-right">
                            <p className="text-luxury-gold font-bold">#{myEntry.finalRank}</p>
                            {myEntry.prize && myEntry.prize > 0 && (
                              <p className="text-luxury-green text-sm">+{myEntry.prize.toLocaleString()} MON</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('tournament.noTournaments')}</h2>
            <p className="text-white/40">{t('tournament.stayTuned')}</p>
          </div>
        )}

        <AnimatePresence>
          {showRegistrationModal && selectedTournament && (
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
                className="bg-void-panel rounded-2xl w-full max-w-lg p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-4">{t('tournament.registerTitle')}</h3>

                <div className="p-4 bg-void-light/30 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">{t('tournament.entryFee')}</span>
                    <span className="text-luxury-cyan font-mono">{selectedTournament.entryFee} MON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">{t('tournament.prizePool')}</span>
                    <span className="text-luxury-gold font-mono">{selectedTournament.prizePool.toLocaleString()} MON</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">{t('tournament.requirements')}</h4>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-luxury-green" />
                      {t('tournament.req.notInArena')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-luxury-green" />
                      {t('tournament.req.walletBalance')}
                    </li>
                    {selectedTournament.type === 'daily' && (
                      <li className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-luxury-gold" />
                        {t('tournament.req.challengeChampion')}
                      </li>
                    )}
                    {selectedTournament.type === 'weekly' && (
                      <li className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-luxury-gold" />
                        {t('tournament.req.sundayChampion')}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">{t('tournament.selectAgent')}</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getQualifiedAgentsForTournament(selectedTournament.id).map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                          selectedAgentId === agent.id
                            ? 'bg-luxury-purple/20 border-luxury-purple/50'
                            : 'bg-void-light/30 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: agent.color }} />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{agent.name}</p>
                          <p className="text-xs text-white/40">{agent.balance.toLocaleString()} MON</p>
                        </div>
                        {selectedAgentId === agent.id && (
                          <CheckCircle className="w-5 h-5 text-luxury-purple" />
                        )}
                      </button>
                    ))}
                    {getQualifiedAgentsForTournament(selectedTournament.id).length === 0 && (
                      <div className="text-center py-8 text-white/40">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>{t('tournament.noQualifiedAgents')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRegistrationModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={!selectedAgentId}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {t('tournament.confirmRegister')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBracketModal && selectedTournament && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-void-panel rounded-2xl w-full max-w-6xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{selectedTournament.name} - {t('tournament.bracket')}</h3>
                  <button
                    onClick={() => setShowBracketModal(false)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <TournamentBracket tournament={selectedTournament} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAutoSettingsModal && (
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
                className="bg-void-panel rounded-2xl w-full max-w-lg p-6 border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-luxury-cyan" />
                  {t('tournament.autoSettings')}
                </h3>

                <div className="flex items-center justify-between p-4 bg-void-light/30 rounded-xl mb-4">
                  <div>
                    <p className="text-white font-medium">{t('tournament.enableAuto')}</p>
                    <p className="text-sm text-white/40">{t('tournament.autoDesc')}</p>
                  </div>
                  <button
                    onClick={() => setTournamentAutoSettings({ enabled: !tournamentAutoSettings.enabled })}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      tournamentAutoSettings.enabled ? 'bg-luxury-green' : 'bg-white/20'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white absolute top-1"
                      animate={{ left: tournamentAutoSettings.enabled ? '32px' : '4px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="space-y-4 mb-4">
                  <div className="p-4 bg-void-light/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-luxury-cyan" />
                        <span className="text-white font-medium">{t('tournament.challenge')}</span>
                      </div>
                      <button
                        onClick={() =>
                          setTournamentAutoSettings({
                            challenge: {
                              ...tournamentAutoSettings.challenge,
                              enabled: !tournamentAutoSettings.challenge.enabled,
                            },
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          tournamentAutoSettings.challenge?.enabled ? 'bg-luxury-cyan' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white absolute top-1"
                          animate={{ left: tournamentAutoSettings.challenge?.enabled ? '26px' : '4px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-white/40">{t('tournament.challengeAutoDesc')}</p>
                  </div>

                  <div className="p-4 bg-void-light/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-luxury-purple" />
                        <span className="text-white font-medium">{t('tournament.daily')}</span>
                      </div>
                      <button
                        onClick={() =>
                          setTournamentAutoSettings({
                            daily: {
                              ...tournamentAutoSettings.daily,
                              enabled: !tournamentAutoSettings.daily.enabled,
                            },
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          tournamentAutoSettings.daily?.enabled ? 'bg-luxury-purple' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white absolute top-1"
                          animate={{ left: tournamentAutoSettings.daily?.enabled ? '26px' : '4px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-white/40">{t('tournament.dailyAutoDesc')}</p>
                  </div>

                  <div className="p-4 bg-void-light/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-luxury-gold" />
                        <span className="text-white font-medium">{t('tournament.weekly')}</span>
                      </div>
                      <button
                        onClick={() =>
                          setTournamentAutoSettings({
                            weekly: {
                              ...tournamentAutoSettings.weekly,
                              enabled: !tournamentAutoSettings.weekly.enabled,
                            },
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          tournamentAutoSettings.weekly?.enabled ? 'bg-luxury-gold' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full bg-white absolute top-1"
                          animate={{ left: tournamentAutoSettings.weekly?.enabled ? '26px' : '4px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-white/40">{t('tournament.weeklyAutoDesc')}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAutoSettingsModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={saveAutoSettings}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-luxury-cyan to-luxury-purple text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t('tournament.saveSettings')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHistoryModal && (
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
                className="bg-void-panel rounded-2xl w-full max-w-2xl p-6 border border-white/10 max-h-[80vh] overflow-y-auto"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-luxury-gold" />
                  {t('tournament.history')}
                </h3>

                {tournamentHistory.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p>{t('tournament.noHistory')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tournamentHistory.map((history) => {
                      const type = getTypeConfig(history.type);
                      const TypeIcon = type.icon;

                      return (
                        <div
                          key={history.tournamentId}
                          className="p-4 bg-void-light/30 rounded-xl border border-white/5"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${type.bgColor} flex items-center justify-center`}>
                                <TypeIcon className={`w-4 h-4 ${type.color}`} />
                              </div>
                              <span className="text-white font-medium">{history.name}</span>
                            </div>
                            <span className="text-xs text-white/40">{formatTime(history.endTime)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-white/60">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {history.totalParticipants}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-luxury-gold" />
                                {history.prizePool.toLocaleString()} MON
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: history.winner.color }}
                              />
                              <span className="text-luxury-gold">{history.winner.name}</span>
                              <Crown className="w-4 h-4 text-luxury-gold" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full mt-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  {t('common.close')}
                </button>
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

export default Tournament;
