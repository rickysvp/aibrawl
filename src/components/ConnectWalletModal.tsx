import React, { useState } from 'react';
import { X, Wallet, User } from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (nickname: string, type: 'twitter' | 'google' | 'wallet') => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'nickname' | 'method'>('nickname');

  if (!isOpen) return null;

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setStep('method');
    }
  };

  const handleConnect = (type: 'twitter' | 'google' | 'wallet') => {
    onConnect(nickname.trim(), type);
    setNickname('');
    setStep('nickname');
    onClose();
  };

  const handleClose = () => {
    setNickname('');
    setStep('nickname');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-sm card-luxury rounded-2xl border border-white/10 p-6 animate-scale-in">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {step === 'nickname' ? 'Enter Nickname' : 'Connect'}
          </h2>
          <p className="text-sm text-white/50">
            {step === 'nickname' ? '设置你在平台内的昵称' : '选择连接方式'}
          </p>
        </div>

        {step === 'nickname' ? (
          /* 昵称输入步骤 */
          <form onSubmit={handleNicknameSubmit}>
            <div className="relative mb-4">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入昵称 (2-20个字符)"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-luxury-cyan/50"
                maxLength={20}
                minLength={2}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={nickname.trim().length < 2}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-luxury-purple to-luxury-cyan text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </form>
        ) : (
          /* 连接方式选择步骤 */
          <>
            {/* 显示已输入的昵称 */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg text-center">
              <span className="text-white/50 text-sm">昵称: </span>
              <span className="text-white font-semibold">{nickname}</span>
              <button
                onClick={() => setStep('nickname')}
                className="ml-2 text-luxury-cyan text-sm hover:underline"
              >
                修改
              </button>
            </div>

            {/* Twitter 长按钮 */}
            <button
              onClick={() => handleConnect('twitter')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 mb-4 rounded-xl bg-[#1DA1F2] hover:bg-[#1a91da] transition-colors text-white font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Connect with Twitter
            </button>

            {/* 分隔线 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/40">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* 两个图标选项 */}
            <div className="flex justify-center gap-4">
              {/* Google */}
              <button
                onClick={() => handleConnect('google')}
                className="w-14 h-14 rounded-xl bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>

              {/* Wallet */}
              <button
                onClick={() => handleConnect('wallet')}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-luxury-purple to-luxury-cyan flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Wallet className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectWalletModal;
