import React from 'react';
import { motion } from 'framer-motion';
import type { Tournament, TournamentRound } from '../types';
import { Clock, Users, Trophy, Zap, ChevronRight } from 'lucide-react';

interface TournamentProgressProps {
  tournament: Tournament;
}

const TournamentProgress: React.FC<TournamentProgressProps> = ({ tournament }) => {
  const rounds: { key: TournamentRound; label: string; participants: number }[] = [
    { key: 'round128', label: '128强', participants: 128 },
    { key: 'round32', label: '32强', participants: 32 },
    { key: 'round8', label: '8强', participants: 8 },
    { key: 'semifinal', label: '半决赛', participants: 4 },
    { key: 'final', label: '决赛', participants: 2 },
  ];

  const currentRoundIndex = rounds.findIndex((r) => r.key === tournament.currentRound);
  const progress = ((currentRoundIndex + 1) / rounds.length) * 100;

  // 获取当前轮次的比赛状态
  const getRoundStatus = (roundKey: TournamentRound, index: number) => {
    const roundMatches = tournament.matches.filter((m) => m.round === roundKey);
    const completedMatches = roundMatches.filter((m) => m.winnerId);

    if (index < currentRoundIndex) {
      return { status: 'completed', completed: roundMatches.length, total: roundMatches.length };
    } else if (index === currentRoundIndex && tournament.status === 'ongoing') {
      return { status: 'ongoing', completed: completedMatches.length, total: roundMatches.length };
    } else {
      return { status: 'pending', completed: 0, total: Math.max(1, Math.floor(rounds[index].participants / 2)) };
    }
  };

  return (
    <div className="card-luxury rounded-2xl p-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">锦标赛进度</h3>
          <p className="text-sm text-white/40">
            {tournament.status === 'ongoing' ? '比赛进行中' : tournament.status === 'finished' ? '比赛已结束' : '等待开始'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-luxury-gold">
            {currentRoundIndex + 1} / {rounds.length}
          </div>
          <p className="text-xs text-white/40">轮次</p>
        </div>
      </div>

      {/* 总体进度条 */}
      <div className="mb-8">
        <div className="h-3 bg-void-light rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-luxury-purple via-luxury-cyan to-luxury-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40">
          <span>开始</span>
          <span>冠军</span>
        </div>
      </div>

      {/* 轮次详情 */}
      <div className="space-y-3">
        {rounds.map((round, index) => {
          const { status, completed, total } = getRoundStatus(round.key, index);
          const isActive = index === currentRoundIndex && tournament.status === 'ongoing';
          const isCompleted = index < currentRoundIndex || (tournament.status === 'finished' && index <= currentRoundIndex);

          return (
            <motion.div
              key={round.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-luxury-amber/5 border-luxury-amber/30'
                  : isCompleted
                  ? 'bg-luxury-green/5 border-luxury-green/20'
                  : 'bg-void-light/20 border-white/5'
              }`}
            >
              {/* 状态指示器 */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-luxury-green/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-luxury-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-8 h-8 rounded-full bg-luxury-amber/20 flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 text-luxury-amber" />
                  </motion.div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white/20" />
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="pl-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${isActive ? 'text-luxury-amber' : isCompleted ? 'text-luxury-green' : 'text-white/60'}`}>
                      {round.label}
                    </h4>
                    <p className="text-xs text-white/40 mt-1">
                      {round.participants} 人参与
                    </p>
                  </div>
                  <div className="text-right">
                    {isActive ? (
                      <div className="text-sm">
                        <span className="text-luxury-amber font-bold">{completed}</span>
                        <span className="text-white/40">/{total}</span>
                      </div>
                    ) : isCompleted ? (
                      <span className="text-xs text-luxury-green">已完成</span>
                    ) : (
                      <span className="text-xs text-white/20">等待中</span>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                {isActive && total > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-void-light rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-luxury-amber"
                        initial={{ width: 0 }}
                        animate={{ width: `${(completed / total) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 连接线 */}
              {index < rounds.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-3 bg-white/10" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 底部统计 */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-1">
            <Users className="w-3 h-3" />
            <span>参赛者</span>
          </div>
          <p className="text-lg font-bold text-white">{tournament.participants.length}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-1">
            <Trophy className="w-3 h-3" />
            <span>总场次</span>
          </div>
          <p className="text-lg font-bold text-white">{tournament.matches.length}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-1">
            <Zap className="w-3 h-3" />
            <span>已完成</span>
          </div>
          <p className="text-lg font-bold text-luxury-green">
            {tournament.matches.filter((m) => m.winnerId).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TournamentProgress;
