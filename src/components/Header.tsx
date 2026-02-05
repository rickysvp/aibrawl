import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Wallet, LogOut, Zap, Sparkles, GitBranch, Trophy, TrendingUp } from 'lucide-react';
import versionData from '../../version.json';

// 生成今日 TOP 100 排行榜数据
const generateTop100 = () => {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
  const colors = ['text-luxury-gold', 'text-luxury-cyan', 'text-luxury-purple', 'text-luxury-rose', 'text-luxury-green'];
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    name: `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 9999)}`,
    profit: Math.floor(Math.random() * 50000) + 1000,
    color: colors[Math.floor(Math.random() * colors.length)]
  })).sort((a, b) => b.profit - a.profit);
};

// 跑马灯组件
const LeaderboardMarquee: React.FC = () => {
  const top100 = useMemo(() => generateTop100(), []);

  return (
    <div className="w-full bg-void-panel/80 border-b border-white/5 overflow-hidden">
      <div className="flex items-center">
        {/* 标题 */}
        <div className="flex-shrink-0 px-4 py-2 bg-luxury-gold/10 border-r border-white/10 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-luxury-gold" />
          <span className="text-xs font-semibold text-luxury-gold">今日 TOP 100</span>
        </div>
        {/* 滚动内容 */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {top100.map((agent, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2">
                <span className="text-xs text-white/40 font-mono">#{agent.rank}</span>
                <span className={`text-xs font-medium ${agent.color}`}>{agent.name}</span>
                <span className="text-xs text-luxury-green font-mono">+{agent.profit.toLocaleString()}</span>
                <span className="text-[10px] text-white/20">$MON</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, systemAgents } = useGameStore();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showVersion, setShowVersion] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {/* 排行榜跑马灯 */}
      <LeaderboardMarquee />

      <header
        className={`fixed top-[33px] left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass-strong shadow-luxury'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-4 group cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative">
            {/* 发光背景 */}
            <div className={`absolute inset-0 bg-gradient-to-br from-luxury-purple to-luxury-cyan rounded-xl blur-xl transition-opacity duration-300 ${hovered ? 'opacity-60' : 'opacity-40'}`} />
            
            {/* Logo 图标 */}
            <div className="relative w-12 h-12 bg-gradient-to-br from-void-panel to-void-elevated rounded-xl border border-luxury-purple/30 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-luxury-purple/20 to-luxury-cyan/20" />
              <span className="relative text-2xl font-bold text-gradient font-display">A</span>
              
              {/* 装饰角标 */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-luxury-gold rounded-bl-lg" />
            </div>
            
            {/* 脉冲动画 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-luxury-purple via-luxury-cyan to-luxury-purple rounded-xl opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-white tracking-wider">
                AI<span className="text-gradient">rena</span>
              </h1>
              {/* 版本号 */}
              <div 
                className="relative"
                onMouseEnter={() => setShowVersion(true)}
                onMouseLeave={() => setShowVersion(false)}
              >
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-luxury-purple/20 text-luxury-purple-light border border-luxury-purple/30 cursor-pointer hover:bg-luxury-purple/30 transition-colors">
                  v{versionData.version}
                </span>
                
                {/* 版本信息弹窗 */}
                {showVersion && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl border border-white/10 p-4 z-50 animate-scale-in">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="w-4 h-4 text-luxury-purple" />
                      <span className="text-sm font-semibold text-white">版本信息</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/40">当前版本</span>
                        <span className="text-luxury-gold font-mono">v{versionData.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">发布日期</span>
                        <span className="text-white/80">{versionData.releaseDate}</span>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-white/40 mb-1">部署地址</p>
                        <a 
                          href={versionData.deployments.vercel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-luxury-cyan hover:underline mb-1"
                        >
                          Vercel →
                        </a>
                        <a 
                          href={versionData.deployments.lovable.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-luxury-purple hover:underline"
                        >
                          Lovable →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Agent 2 Earn</p>
          </div>
        </div>

        {/* 钱包连接 */}
        <div className="flex items-center gap-4">
          {wallet.connected ? (
            <>
              {/* 余额显示卡片 */}
              <div className="hidden md:flex items-center gap-1 glass rounded-xl px-4 py-2 border border-white/5">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-gold/20 to-luxury-amber/20 border border-luxury-gold/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Balance</p>
                    <p className="text-sm font-bold text-luxury-gold font-mono">{wallet.balance.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pl-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-purple/20 to-luxury-rose/20 border border-luxury-purple/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-luxury-purple-light" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Locked</p>
                    <p className="text-sm font-bold text-luxury-purple-light font-mono">{wallet.lockedBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {/* 地址和断开按钮 */}
              <div className="flex items-center gap-2">
                <div className="glass rounded-xl px-4 py-2 border border-luxury-cyan/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-luxury-green animate-pulse" />
                  <span className="text-sm text-white/80 font-mono">{formatAddress(wallet.address)}</span>
                </div>
                
                <button
                  onClick={disconnectWallet}
                  className="p-3 glass rounded-xl border border-white/10 text-white/60 hover:text-luxury-rose hover:border-luxury-rose/50 transition-all duration-300 hover:shadow-lg hover:shadow-luxury-rose/20"
                  title="断开连接"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="group relative px-8 py-3 overflow-hidden rounded-xl transition-all duration-300"
            >
              {/* 背景渐变 */}
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan opacity-90 group-hover:opacity-100 transition-opacity" />
              
              {/* 闪光效果 */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              {/* 内容 */}
              <span className="relative flex items-center gap-2 text-white font-semibold font-display tracking-wide">
                <Wallet className="w-5 h-5" />
                连接钱包
              </span>
            </button>
          )}
        </div>
      </div>
      
      {/* 底部渐变线 */}
      <div className={`h-px bg-gradient-to-r from-transparent via-luxury-purple/50 to-transparent transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
    </header>
    </>
  );
};

export default Header;
