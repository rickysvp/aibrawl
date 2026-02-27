import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from 'react-i18next';
import { Wallet, LogOut, Zap, Sparkles, Globe, Users, Trophy } from 'lucide-react';
import ConnectWalletModal from './ConnectWalletModal';
import { languages } from '../i18n';

const Header: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, myAgents, systemAgents, totalSystemRounds } = useGameStore();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  const handleConnect = (nickname: string, type: 'twitter' | 'google' | 'wallet') => {
    connectWallet(nickname, type);
    setShowConnectModal(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-strong shadow-luxury'
          : 'bg-transparent'
      }`}
    >
        <div className="max-w-screen-xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center group cursor-pointer">
            <img 
              src="/logo/AIBRAWL.png" 
              alt="AI Brawl" 
              className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-transform duration-300 group-hover:scale-105"
            />
            {/* 装饰性光效 */}
            <div className="absolute -inset-4 bg-gradient-to-r from-luxury-purple/20 via-luxury-cyan/20 to-luxury-gold/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full pointer-events-none" />
          </div>
          {/* 平台统计 */}
          <div className="hidden md:flex items-center gap-1 glass rounded-xl px-4 py-2 border border-white/5">
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-purple/20 to-luxury-cyan/20 border border-luxury-purple/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-luxury-purple" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('platform.agents')}</p>
                <p className="text-sm font-bold text-white font-mono">{(myAgents.length + systemAgents.length).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-3 pr-4 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-gold/20 to-luxury-amber/20 border border-luxury-gold/30 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-luxury-gold" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">TVL (MON)</p>
                <p className="text-sm font-bold text-luxury-gold font-mono">{[...myAgents, ...systemAgents].reduce((sum, a) => sum + a.balance, 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-cyan/20 to-luxury-blue/20 border border-luxury-cyan/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-luxury-cyan" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Round</p>
                <p className="text-sm font-bold text-luxury-cyan font-mono">{totalSystemRounds.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 钱包连接 */}
        <div className="flex items-center gap-3">
          {/* 语言切换器 */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center justify-center glass rounded-xl w-11 h-11 border border-white/10 hover:border-white/20 active:bg-white/10 transition-colors"
            >
              <Globe className="w-5 h-5 text-white/60" />
            </button>

            {/* 语言下拉菜单 */}
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-40 glass-strong rounded-xl border border-white/10 p-2 z-50 animate-scale-in">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      i18n.language === lang.code
                        ? 'bg-luxury-cyan/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {wallet.connected ? (
            <>
              {/* 余额显示卡片 */}
              <div className="hidden md:flex items-center gap-1 glass rounded-xl px-4 py-2 border border-white/5">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-gold/20 to-luxury-amber/20 border border-luxury-gold/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('header.balance')}</p>
                    <p className="text-sm font-bold text-luxury-gold font-mono">{wallet.balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxury-purple/20 to-luxury-rose/20 border border-luxury-purple/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-luxury-purple-light" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('header.locked')}</p>
                    <p className="text-sm font-bold text-luxury-purple-light font-mono">{wallet.lockedBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 用户信息下拉菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-3 glass rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <img
                    src={wallet.avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{wallet.nickname}</p>
                    <p className="text-[10px] text-white/40">
                      {wallet.loginType === 'wallet' ? `0x...${wallet.address.slice(-6)}` : wallet.loginType}
                    </p>
                  </div>
                </button>

                {/* 下拉菜单 */}
                {showWalletMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 glass-strong rounded-xl border border-white/10 p-4 z-50 animate-scale-in">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                      <img
                        src={wallet.avatar}
                        alt="avatar"
                        className="w-12 h-12 rounded-full border border-white/20"
                      />
                      <div>
                        <p className="font-bold text-white">{wallet.nickname}</p>
                        <p className="text-xs text-white/40">
                          {wallet.loginType === 'wallet' ? `Wallet: 0x...${wallet.address.slice(-6)}` : `Login: ${wallet.loginType}`}
                        </p>
                      </div>
                    </div>

                    {/* 余额信息 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{t('header.balance')}</span>
                        <span className="text-luxury-gold font-mono">{wallet.balance.toLocaleString()} $MON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{t('header.locked')}</span>
                        <span className="text-luxury-purple-light font-mono">{wallet.lockedBalance.toLocaleString()} $MON</span>
                      </div>
                    </div>

                    {/* 断开连接按钮 - 仅图标 */}
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowWalletMenu(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-luxury-rose/10 border border-luxury-rose/30 text-luxury-rose hover:bg-luxury-rose/20 transition-colors"
                      title={t('header.disconnect')}
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="group relative px-8 py-3 overflow-hidden rounded-xl transition-all duration-300"
            >
              {/* 背景渐变 */}
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan opacity-90 group-hover:opacity-100 transition-opacity" />

              {/* 闪光效果 */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              {/* 内容 */}
              <span className="relative text-white font-semibold font-display tracking-wide">
                Connect
              </span>
            </button>
          )}

      {/* 连接钱包弹窗 */}
      <ConnectWalletModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
      />
        </div>
      </div>

      {/* 底部渐变线 */}
      <div className={`h-px bg-gradient-to-r from-transparent via-luxury-purple/50 to-transparent transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
    </header>
  );
};

export default Header;
