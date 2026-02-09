import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { Wallet, X, Plus, Minus, Swords } from 'lucide-react';

interface QuickRechargeModalProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
  agentStatus?: string;
}

const QuickRechargeModal: React.FC<QuickRechargeModalProps> = ({
  agentId,
  agentName,
  isOpen,
  onClose,
  agentStatus = 'idle',
}) => {
  const { t } = useTranslation();
  const { wallet, allocateFunds, joinArena } = useGameStore();
  const [amount, setAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJoinOption, setShowJoinOption] = useState(false);

  if (!isOpen) return null;

  const handleRecharge = async () => {
    if (amount <= 0) return;
    if (amount > wallet.balance) {
      alert(t('wallet.insufficientBalance'));
      return;
    }

    setIsProcessing(true);
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    allocateFunds(agentId, amount);
    
    setIsProcessing(false);
    
    // 如果Agent是idle状态，显示加入竞技场选项
    if (agentStatus === 'idle') {
      setShowJoinOption(true);
    } else {
      onClose();
      alert(`${t('wallet.rechargeSuccess')} ${amount} $MON`);
    }
  };

  const handleJoinArena = () => {
    joinArena(agentId);
    onClose();
    alert(`${agentName} 已加入竞技场！`);
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  // 如果显示加入竞技场选项，渲染不同的UI
  if (showJoinOption) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-green/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-luxury-green" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">充值成功！</h3>
          <p className="text-white/60 mb-6">{agentName} 已充值 {amount} $MON</p>
          <div className="space-y-3">
            <button
              onClick={handleJoinArena}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-luxury-gold to-luxury-amber text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              立即加入竞技场
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all"
            >
              稍后再说
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-luxury-cyan/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-luxury-cyan" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{t('wallet.recharge')}</h3>
              <p className="text-xs text-white/40">{agentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 space-y-5">
          {/* 当前余额 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-sm text-white/60">{t('wallet.currentBalance')}</span>
            <span className="text-lg font-mono font-bold text-luxury-gold">
              ${wallet.balance.toLocaleString()}
            </span>
          </div>

          {/* 金额输入 */}
          <div className="space-y-3">
            <label className="text-sm text-white/60">{t('wallet.amount')}</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAmount(Math.max(10, amount - 10))}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-white/60" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center text-xl font-mono font-bold text-white focus:border-luxury-cyan focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">$MON</span>
              </div>
              <button
                onClick={() => setAmount(amount + 10)}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* 快捷金额 */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  amount === amt
                    ? 'bg-luxury-cyan/20 text-luxury-cyan border border-luxury-cyan/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          {/* 确认按钮 */}
          <button
            onClick={handleRecharge}
            disabled={isProcessing || amount <= 0 || amount > wallet.balance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-luxury-cyan to-luxury-cyan-light text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('common.processing')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" />
                {t('wallet.recharge')} {amount} $MON
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickRechargeModal;
