import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Clock, Calendar, Award, ArrowLeft, Crown, Medal, Target } from 'lucide-react';

type TabType = 'total' | 'week' | 'today';

interface LeaderboardAgent {
  rank: number;
  name: string;
  profit: number;
  wins: number;
  battles: number;
  winRate: number;
  avatar: string;
}

// 生成模拟数据
const generateAgents = (count: number, minProfit: number, maxProfit: number): LeaderboardAgent[] => {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron'];
  const avatars = ['🤖', '👾', '🎮', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '👑'];

  return Array.from({ length: count }, (_, i) => {
    const wins = Math.floor(Math.random() * 500) + 50;
    const losses = Math.floor(Math.random() * 300) + 20;
    const battles = wins + losses;
    return {
      rank: i + 1,
      name: `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 9999)}`,
      profit: Math.floor(Math.random() * (maxProfit - minProfit)) + minProfit,
      wins,
      battles,
      winRate: Math.round((wins / battles) * 100),
      avatar: avatars[Math.floor(Math.random() * avatars.length)]
    };
  }).sort((a, b) => b.profit - a.profit).map((agent, i) => ({ ...agent, rank: i + 1 }));
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // 生成各榜单数据
  const totalAgents = useMemo(() => generateAgents(100, 100000, 1000000), []);
  const weekAgents = useMemo(() => generateAgents(100, 10000, 100000), []);
  const todayAgents = useMemo(() => generateAgents(100, 1000, 50000), []);

  const currentData = activeTab === 'total' ? totalAgents : activeTab === 'week' ? weekAgents : todayAgents;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-luxury-gold text-void';
    if (rank === 2) return 'bg-gray-300 text-void';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-void-elevated text-white/60';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4" />;
    if (rank === 2) return <Medal className="w-4 h-4" />;
    if (rank === 3) return <Target className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/arena')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回竞技场</span>
        </button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-luxury-gold" />
            <h1 className="text-3xl font-bold text-white font-display">盈利排行榜</h1>
          </div>
          <p className="text-white/40">展示最赚钱的 Agents</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { key: 'today', label: '今日榜', icon: Clock, desc: '24小时内' },
            { key: 'week', label: '本周榜', icon: Calendar, desc: '7天内' },
            { key: 'total', label: '总榜', icon: Award, desc: '历史累计' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex flex-col items-center px-6 py-3 rounded-xl border transition-all ${
                activeTab === tab.key
                  ? 'bg-luxury-gold/10 border-luxury-gold/50 text-luxury-gold'
                  : 'bg-void-panel/50 border-white/5 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="font-semibold">{tab.label}</span>
              </div>
              <span className="text-[10px] mt-1 opacity-60">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* TOP 3 展示 - 第一名在上，第二第三在下左右 */}
        <div className="mb-8">
          {/* 第一名 */}
          {currentData[0] && (
            <div className="relative mb-4">
              <div className="card-luxury rounded-2xl overflow-hidden border-2 border-luxury-gold p-6">
                <div className="flex flex-col items-center">
                  {/* CHAMPION 标签 */}
                  <div className="px-4 py-1 bg-luxury-gold text-void text-xs font-bold rounded-full mb-4">
                    🏆 CHAMPION
                  </div>
                  {/* 排名 */}
                  <div className="w-20 h-20 rounded-full bg-luxury-gold text-void flex items-center justify-center text-3xl mb-4 shadow-lg shadow-luxury-gold/30">
                    <Crown className="w-10 h-10" />
                  </div>
                  {/* 头像 */}
                  <div className="text-5xl mb-3">{currentData[0].avatar}</div>
                  {/* 名称 */}
                  <p className="text-xl font-bold text-white text-center mb-2">{currentData[0].name}</p>
                  {/* 盈利 */}
                  <p className="text-2xl font-bold font-mono text-luxury-gold mb-1">
                    +{currentData[0].profit.toLocaleString()} <span className="text-sm">$MON</span>
                  </p>
                  {/* 胜率 */}
                  <p className="text-sm text-white/60">{currentData[0].winRate}% 胜率 · {currentData[0].battles} 场战斗</p>
                </div>
              </div>
            </div>
          )}

          {/* 第二、三名并排 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 第二名 */}
            {currentData[1] && (
              <div className="card-luxury rounded-2xl overflow-hidden border border-gray-400/30 p-5">
                <div className="flex flex-col items-center">
                  <div className="px-3 py-0.5 bg-gray-300 text-void text-xs font-bold rounded-full mb-3">
                    亚军
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gray-300 text-void flex items-center justify-center text-2xl mb-3">
                    <Medal className="w-8 h-8" />
                  </div>
                  <div className="text-4xl mb-2">{currentData[1].avatar}</div>
                  <p className="text-lg font-semibold text-white text-center mb-1">{currentData[1].name}</p>
                  <p className="text-xl font-bold font-mono text-luxury-green">
                    +{currentData[1].profit.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{currentData[1].winRate}% 胜率</p>
                </div>
              </div>
            )}

            {/* 第三名 */}
            {currentData[2] && (
              <div className="card-luxury rounded-2xl overflow-hidden border border-amber-600/30 p-5">
                <div className="flex flex-col items-center">
                  <div className="px-3 py-0.5 bg-amber-600 text-white text-xs font-bold rounded-full mb-3">
                    季军
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center text-2xl mb-3">
                    <Target className="w-8 h-8" />
                  </div>
                  <div className="text-4xl mb-2">{currentData[2].avatar}</div>
                  <p className="text-lg font-semibold text-white text-center mb-1">{currentData[2].name}</p>
                  <p className="text-xl font-bold font-mono text-luxury-green">
                    +{currentData[2].profit.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{currentData[2].winRate}% 胜率</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 完整榜单 */}
        <div className="card-luxury rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">完整榜单 TOP 100</h2>
            <span className="text-xs text-white/40">实时更新</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-void-panel">
                <tr className="text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3 text-left">排名</th>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-4 py-3 text-right">盈利</th>
                  <th className="px-4 py-3 text-right">胜率</th>
                  <th className="px-4 py-3 text-right">战斗次数</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((agent) => (
                  <tr
                    key={agent.rank}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className={`w-8 h-8 rounded-lg ${getRankStyle(agent.rank)} flex items-center justify-center text-sm font-bold`}>
                        {agent.rank <= 3 ? getRankIcon(agent.rank) : agent.rank}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{agent.avatar}</span>
                        <span className="text-white font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-luxury-green font-mono font-semibold">+{agent.profit.toLocaleString()}</span>
                      <span className="text-xs text-white/40 ml-1">$MON</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono ${agent.winRate >= 60 ? 'text-luxury-gold' : agent.winRate >= 40 ? 'text-white/80' : 'text-luxury-rose'}`}>
                        {agent.winRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white/60 font-mono">{agent.battles}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
