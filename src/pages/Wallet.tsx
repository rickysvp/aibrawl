import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Plus, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  RefreshCw,
  Image,
  Users,
  Gift,
  ChevronRight,
  X,
  QrCode,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  Download,
  ExternalLink
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'mint' | 'battle_win' | 'battle_loss' | 'deposit' | 'withdraw' | 'swap';
  amount: number;
  timestamp: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

interface NFT {
  id: string;
  name: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
  tokenId: string;
  attributes: { trait: string; value: string }[];
  obtainedAt: number;
}

interface InviteRecord {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  totalDeposit: number;
  reward: number;
  isActive: boolean;
}

// 模拟汇率数据
const MON_TO_USDT_RATE = 0.052;
const MON_PRICE_CHANGE_24H = 5.23;

const WalletPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { wallet, myAgents, connectWallet } = useGameStore();
  
  // 弹窗状态
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showNFTDetailModal, setShowNFTDetailModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showInviteDetailModal, setShowInviteDetailModal] = useState(false);
  const [showTxDetailModal, setShowTxDetailModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // 交易记录筛选
  const [txFilter, setTxFilter] = useState<'all' | 'deposit' | 'withdraw' | 'swap' | 'battle'>('all');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  
  // Toast通知
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  // 模拟交易记录
  const transactions: Transaction[] = [
    { id: '1', type: 'swap', amount: -100, timestamp: Date.now() - 1800000, description: t('wallet.swap'), status: 'completed', txHash: '0x1234...5678' },
    { id: '2', type: 'mint', amount: -100, timestamp: Date.now() - 3600000, description: t('wallet.mintAgent'), status: 'completed', txHash: '0xabcd...efgh' },
    { id: '3', type: 'battle_win', amount: 50, timestamp: Date.now() - 7200000, description: t('wallet.battleWin'), status: 'completed' },
    { id: '4', type: 'battle_loss', amount: -30, timestamp: Date.now() - 10800000, description: t('wallet.battleLoss'), status: 'completed' },
    { id: '5', type: 'deposit', amount: 500, timestamp: Date.now() - 86400000, description: t('wallet.deposit'), status: 'completed', txHash: '0x9876...5432' },
  ];

  // Monad RealNads NFT 数据 - 使用本地图片
  const nfts: NFT[] = [
    {
      id: '1',
      name: 'Cyber Agent #001',
      image: '/nfts/nft1.png',
      rarity: 'legendary',
      value: 5000,
      tokenId: '0x1234...5678',
      attributes: [
        { trait: 'Background', value: 'Purple' },
        { trait: 'Eyes', value: 'Cyber' },
        { trait: 'Mouth', value: 'Smile' },
        { trait: 'Accessory', value: 'Headset' }
      ],
      obtainedAt: Date.now() - 86400000 * 30
    },
    {
      id: '2',
      name: 'Ninja Agent #002',
      image: '/nfts/nft2.png',
      rarity: 'epic',
      value: 2000,
      tokenId: '0xabcd...efgh',
      attributes: [
        { trait: 'Background', value: 'Orange' },
        { trait: 'Eyes', value: 'Normal' },
        { trait: 'Mouth', value: 'Grin' },
        { trait: 'Accessory', value: 'Glasses' }
      ],
      obtainedAt: Date.now() - 86400000 * 15
    },
    {
      id: '3',
      name: 'Wizard Agent #003',
      image: '/nfts/nft3.png',
      rarity: 'rare',
      value: 800,
      tokenId: '0x9876...5432',
      attributes: [
        { trait: 'Background', value: 'Violet' },
        { trait: 'Eyes', value: 'Happy' },
        { trait: 'Mouth', value: 'Open' },
        { trait: 'Accessory', value: 'Hat' }
      ],
      obtainedAt: Date.now() - 86400000 * 7
    },
    {
      id: '4',
      name: 'GMONAD Agent #004',
      image: '/nfts/nft4.png',
      rarity: 'epic',
      value: 1500,
      tokenId: '0xdefa...1234',
      attributes: [
        { trait: 'Background', value: 'Blue' },
        { trait: 'Eyes', value: 'VR' },
        { trait: 'Mouth', value: 'Cool' },
        { trait: 'Accessory', value: 'Goggles' }
      ],
      obtainedAt: Date.now() - 86400000 * 3
    },
  ];
  
  // 模拟邀请记录
  const inviteRecords: InviteRecord[] = [
    { id: '1', name: 'PlayerOne', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', joinedAt: Date.now() - 86400000 * 10, totalDeposit: 5000, reward: 100, isActive: true },
    { id: '2', name: 'CryptoKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', joinedAt: Date.now() - 86400000 * 5, totalDeposit: 2000, reward: 100, isActive: true },
    { id: '3', name: 'GameMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p3', joinedAt: Date.now() - 86400000 * 2, totalDeposit: 0, reward: 0, isActive: false },
  ];
  
  const totalAssets = wallet.balance + wallet.lockedBalance;
  const agentsTotalBalance = myAgents.reduce((sum, a) => sum + a.balance, 0);
  
  // 换算USDT
  const toUSDT = (monAmount: number) => (monAmount * MON_TO_USDT_RATE).toFixed(2);
  
  // 显示Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // 设置加载状态
  const setLoading = (key: string, value: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: value }));
  };
  
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'mint': return { icon: Plus, color: 'text-luxury-purple', bgColor: 'bg-luxury-purple' };
      case 'battle_win': return { icon: TrendingUp, color: 'text-luxury-green', bgColor: 'bg-luxury-green' };
      case 'battle_loss': return { icon: TrendingDown, color: 'text-luxury-rose', bgColor: 'bg-luxury-rose' };
      case 'deposit': return { icon: ArrowDownRight, color: 'text-luxury-cyan', bgColor: 'bg-luxury-cyan' };
      case 'withdraw': return { icon: ArrowUpRight, color: 'text-luxury-amber', bgColor: 'bg-luxury-amber' };
      case 'swap': return { icon: RefreshCw, color: 'text-luxury-gold', bgColor: 'bg-luxury-gold' };
    }
  };

  const getRarityColor = (rarity: NFT['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'from-luxury-gold to-luxury-amber';
      case 'epic': return 'from-luxury-purple to-luxury-rose';
      case 'rare': return 'from-luxury-cyan to-luxury-blue';
      case 'common': return 'from-white/40 to-white/20';
    }
  };
  
  const getRarityBgColor = (rarity: NFT['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'bg-luxury-gold/20 border-luxury-gold/40';
      case 'epic': return 'bg-luxury-purple/20 border-luxury-purple/40';
      case 'rare': return 'bg-luxury-cyan/20 border-luxury-cyan/40';
      case 'common': return 'bg-white/10 border-white/20';
    }
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const isZh = i18n.language === 'zh-CN';

    if (diff < 60000) return isZh ? '刚刚' : 'Just now';
    if (diff < 3600000) return isZh ? `${Math.floor(diff / 60000)}分钟前` : `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return isZh ? `${Math.floor(diff / 3600000)}小时前` : `${Math.floor(diff / 3600000)}h ago`;

    const locale = isZh ? 'zh-CN' : 'en-US';
    return date.toLocaleString(locale, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    showToast(t('wallet.copied'), 'success');
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText('AI2024VIP');
    showToast(t('wallet.copied'), 'success');
  };

  // 筛选交易记录
  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'battle') return tx.type === 'battle_win' || tx.type === 'battle_loss';
    return tx.type === txFilter;
  }).filter(tx => 
    txSearchQuery === '' || 
    tx.description.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
    tx.id.includes(txSearchQuery)
  );

  // 充值弹窗组件
  const DepositModal = () => {
    const [selectedNetwork, setSelectedNetwork] = useState('monad');
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-md p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{t('wallet.deposit')}</h3>
            <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">{t('wallet.network')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedNetwork('monad')}
                  className={`p-3 rounded-xl border transition-all ${selectedNetwork === 'monad' ? 'bg-luxury-cyan/20 border-luxury-cyan' : 'border-white/10 hover:border-white/30'}`}
                >
                  <p className="text-sm font-medium text-white">{t('wallet.monadTestnet')}</p>
                  <p className="text-xs text-white/40">{t('wallet.recommended')}</p>
                </button>
                <button
                  onClick={() => setSelectedNetwork('ethereum')}
                  className={`p-3 rounded-xl border transition-all ${selectedNetwork === 'ethereum' ? 'bg-luxury-cyan/20 border-luxury-cyan' : 'border-white/10 hover:border-white/30'}`}
                >
                  <p className="text-sm font-medium text-white">{t('wallet.ethereum')}</p>
                  <p className="text-xs text-white/40">Mainnet</p>
                </button>
              </div>
            </div>

            <div className="bg-void rounded-xl p-4 border border-white/10">
              <label className="text-sm text-white/60 mb-2 block">{t('wallet.depositAddress')}</label>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 text-sm text-luxury-cyan font-mono bg-void-light px-3 py-2 rounded-lg truncate">
                  {wallet.address}
                </code>
                <button onClick={copyAddress} className="p-2 bg-luxury-cyan/20 rounded-lg hover:bg-luxury-cyan/30 transition-colors">
                  <Copy className="w-4 h-4 text-luxury-cyan" />
                </button>
              </div>
              <div className="w-32 h-32 mx-auto bg-white rounded-xl p-2">
                <div className="w-full h-full bg-void flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-white" />
                </div>
              </div>
              <p className="text-xs text-white/40 text-center mt-2">{t('wallet.scanQR')}</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-luxury-gold/10 rounded-lg border border-luxury-gold/20">
              <AlertCircle className="w-4 h-4 text-luxury-gold flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60">
                <p className="text-luxury-gold font-medium mb-1">{t('wallet.notice')}</p>
                <p>• {t('wallet.minDeposit')}: 10 $MON</p>
                <p>• {t('wallet.arrivalTime')}</p>
                <p>• {t('wallet.networkWarning')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SWAP弹窗组件
  const SwapModal = () => {
    const [fromToken, setFromToken] = useState('USDT');
    const [toToken, setToToken] = useState('MON');
    const [fromAmount, setFromAmount] = useState('');
    const [slippage, setSlippage] = useState(0.5);
    
    const toAmount = fromAmount ? (parseFloat(fromAmount) / MON_TO_USDT_RATE).toFixed(2) : '0';
    
    const handleSwap = () => {
      setLoading('swap', true);
      setTimeout(() => {
        setLoading('swap', false);
        showToast('兑换成功！', 'success');
        setShowSwapModal(false);
      }, 2000);
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-md p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{t('wallet.swap')}</h3>
            <button onClick={() => setShowSwapModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* From */}
            <div className="bg-void rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">支付</span>
                <span className="text-xs text-white/40">余额: 1,000 USDT</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-bold text-white placeholder:text-white/20 outline-none min-w-0"
                />
                <button 
                  onClick={() => setFromAmount('1000')}
                  className="text-xs px-2 py-1 bg-white/10 rounded text-white/60 hover:text-white transition-colors flex-shrink-0"
                >
                  MAX
                </button>
                <div className="flex items-center gap-2 px-3 py-2 bg-void-light rounded-lg flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-luxury-green flex items-center justify-center text-xs font-bold text-white">$</div>
                  <span className="text-sm font-medium text-white">USDT</span>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex justify-center -my-1 relative z-10">
              <button 
                onClick={() => { setFromToken(toToken); setToToken(fromToken); }}
                className="p-2 bg-void-panel border border-white/20 rounded-xl hover:border-luxury-cyan/50 transition-colors"
              >
                <ArrowDownRight className="w-5 h-5 text-luxury-cyan rotate-45" />
              </button>
            </div>
            
            {/* To */}
            <div className="bg-void rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">获得</span>
                <span className="text-xs text-white/40">余额: {wallet.balance.toLocaleString()} MON</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-transparent text-2xl font-bold text-luxury-cyan outline-none min-w-0"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-void-light rounded-lg flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-luxury-gold flex items-center justify-center text-xs font-bold text-white">M</div>
                  <span className="text-sm font-medium text-white">MON</span>
                </div>
              </div>
            </div>
            
            {/* Rate & Slippage */}
            <div className="p-3 bg-void rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">汇率</span>
                <span className="text-white">1 USDT = {(1/MON_TO_USDT_RATE).toFixed(2)} MON</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">滑点容忍度</span>
                <div className="flex gap-2">
                  {[0.5, 1, 3].map(s => (
                    <button 
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${slippage === s ? 'bg-luxury-cyan text-white' : 'bg-white/10 text-white/60'}`}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSwap}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isLoading['swap']}
              className="w-full py-3 rounded-xl bg-luxury-gold text-white font-bold text-lg hover:bg-luxury-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isLoading['swap'] ? <Loader2 className="w-5 h-5 animate-spin" /> : t('wallet.confirmSwap')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 提现弹窗组件
  const WithdrawModal = () => {
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [savedAddresses] = useState([
      { name: '我的MetaMask', address: '0x742d...44e' },
      { name: '交易所', address: '0x1234...5678' }
    ]);
    
    const fee = 2;
    const receiveAmount = amount ? Math.max(0, parseFloat(amount) - fee).toFixed(2) : '0';
    
    const handleWithdraw = () => {
      setLoading('withdraw', true);
      setTimeout(() => {
        setLoading('withdraw', false);
        showToast('提现申请已提交', 'success');
        setShowWithdrawModal(false);
      }, 2000);
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-md p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{t('wallet.withdraw')}</h3>
            <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">{t('wallet.withdrawAddress')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('wallet.enterAddress')}
                  className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 pr-16 text-white placeholder:text-white/30 focus:border-luxury-cyan focus:outline-none"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-white/10 rounded text-luxury-cyan hover:bg-white/20 transition-colors">
                  {t('wallet.addressBook')}
                </button>
              </div>
              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedAddresses.map((saved, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setAddress(saved.address)}
                      className="text-xs px-3 py-1.5 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    >
                      {saved.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Amount */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">{t('wallet.withdrawAmount')}</label>
              <div className="bg-void rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-bold text-white placeholder:text-white/20 outline-none min-w-0"
                  />
                  <button
                    onClick={() => setAmount(wallet.balance.toString())}
                    className="text-xs px-3 py-1.5 bg-luxury-cyan/20 rounded-lg text-luxury-cyan hover:bg-luxury-cyan/30 transition-colors flex-shrink-0"
                  >
                    {t('wallet.max')}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">≈ ${toUSDT(parseFloat(amount) || 0)} USDT</span>
                  <span className="text-white/40">{t('wallet.availableBalance')}: {wallet.balance.toLocaleString()} MON</span>
                </div>
              </div>
            </div>

            {/* Fee info */}
            <div className="p-4 bg-void rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">{t('wallet.withdrawAmount')}</span>
                <span className="text-white font-medium">{amount || '0'} MON</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">{t('wallet.networkFee')}</span>
                <span className="text-white">{fee} MON</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{t('wallet.actualReceive')}</span>
                <span className="text-luxury-green font-bold text-lg">{receiveAmount} MON</span>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={!address || !amount || parseFloat(amount) <= fee || isLoading['withdraw']}
              className="w-full py-3 rounded-xl bg-luxury-amber text-white font-bold text-lg hover:bg-luxury-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading['withdraw'] ? <Loader2 className="w-5 h-5 animate-spin" /> : t('wallet.confirmWithdraw')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // NFT详情弹窗
  const NFTDetailModal = () => {
    if (!selectedNFT) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-lg p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">NFT 详情</h3>
            <button onClick={() => setShowNFTDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          <div className="flex gap-6">
            {/* Image */}
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-void flex-shrink-0">
              <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-full object-cover" />
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-white mb-1">{selectedNFT.name}</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getRarityBgColor(selectedNFT.rarity)} text-white`}>
                  {selectedNFT.rarity}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-void rounded-lg">
                  <p className="text-xs text-white/40 mb-1">当前估值</p>
                  <p className="text-lg font-bold text-luxury-gold">{selectedNFT.value} MON</p>
                  <p className="text-xs text-white/40">≈ ${toUSDT(selectedNFT.value)} USDT</p>
                </div>
                <div className="p-3 bg-void rounded-lg">
                  <p className="text-xs text-white/40 mb-1">Token ID</p>
                  <p className="text-sm font-mono text-luxury-cyan truncate">{selectedNFT.tokenId}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-white/40 mb-2">属性</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNFT.attributes.map((attr, idx) => (
                    <div key={idx} className="p-2 bg-void rounded-lg">
                      <p className="text-[10px] text-white/40 uppercase">{attr.trait}</p>
                      <p className="text-sm text-white font-medium">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2.5 rounded-xl bg-luxury-purple text-white font-medium hover:bg-luxury-purple/90 transition-colors">
                  转让
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-luxury-gold text-white font-medium hover:bg-luxury-gold/90 transition-colors">
                  出售
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 邀请详情弹窗
  const InviteDetailModal = () => {
    const totalInvited = inviteRecords.length;
    const totalReward = inviteRecords.reduce((sum, r) => sum + r.reward, 0);
    const activeFriends = inviteRecords.filter(r => r.isActive).length;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-2xl p-6 border border-white/10 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">邀请好友详情</h3>
            <button onClick={() => setShowInviteDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-void rounded-xl text-center">
              <p className="text-2xl font-bold text-luxury-cyan">{totalInvited}</p>
              <p className="text-xs text-white/40">已邀请</p>
            </div>
            <div className="p-4 bg-void rounded-xl text-center">
              <p className="text-2xl font-bold text-luxury-gold">{totalReward}</p>
              <p className="text-xs text-white/40">获得奖励</p>
            </div>
            <div className="p-4 bg-void rounded-xl text-center">
              <p className="text-2xl font-bold text-luxury-green">{activeFriends}</p>
              <p className="text-xs text-white/40">活跃好友</p>
            </div>
            <div className="p-4 bg-void rounded-xl text-center">
              <p className="text-2xl font-bold text-luxury-purple">{inviteRecords.reduce((sum, r) => sum + r.totalDeposit, 0).toLocaleString()}</p>
              <p className="text-xs text-white/40">好友总充值</p>
            </div>
          </div>
          
          {/* Invite Code */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-luxury-purple/20 to-luxury-cyan/20 rounded-xl border border-luxury-purple/30 mb-6">
            <div className="flex-1">
              <p className="text-xs text-white/40 mb-1">你的邀请码</p>
              <p className="text-xl font-mono text-white font-bold">AI2024VIP</p>
            </div>
            <button 
              onClick={copyInviteCode}
              className="px-4 py-2 bg-luxury-cyan rounded-lg text-white font-medium hover:bg-luxury-cyan/90 transition-colors"
            >
              复制
            </button>
            <button className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
              分享
            </button>
          </div>
          
          {/* Friends List */}
          <div className="flex-1 overflow-auto">
            <h4 className="text-sm font-medium text-white mb-3">好友列表</h4>
            <div className="space-y-2">
              {inviteRecords.map(friend => (
                <div key={friend.id} className="flex items-center gap-4 p-3 bg-void rounded-xl">
                  <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full bg-void-light" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{friend.name}</p>
                    <p className="text-xs text-white/40">{formatTime(friend.joinedAt)} 加入</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-luxury-gold">{friend.reward} MON</p>
                    <p className="text-xs text-white/40">充值 {friend.totalDeposit}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${friend.isActive ? 'bg-luxury-green' : 'bg-white/20'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 交易详情弹窗
  const TxDetailModal = () => {
    if (!selectedTx) return null;
    const config = getTransactionIcon(selectedTx.type);
    const Icon = config.icon;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-void-panel rounded-2xl w-full max-w-md p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">交易详情</h3>
            <button onClick={() => setShowTxDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <p className={`text-3xl font-bold ${selectedTx.amount >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
              {selectedTx.amount >= 0 ? '+' : ''}{selectedTx.amount} MON
            </p>
            <p className="text-white/40 mt-1">≈ ${toUSDT(Math.abs(selectedTx.amount))} USDT</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">交易类型</span>
              <span className="text-white">{selectedTx.description}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">状态</span>
              <span className={`flex items-center gap-1 ${selectedTx.status === 'completed' ? 'text-luxury-green' : selectedTx.status === 'pending' ? 'text-luxury-gold' : 'text-luxury-rose'}`}>
                {selectedTx.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : selectedTx.status === 'pending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                {selectedTx.status === 'completed' ? '已完成' : selectedTx.status === 'pending' ? '处理中' : '失败'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/40">时间</span>
              <span className="text-white">{formatTime(selectedTx.timestamp)}</span>
            </div>
            {selectedTx.txHash && (
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/40">交易哈希</span>
                <a href="#" className="text-luxury-cyan flex items-center gap-1 hover:underline">
                  {selectedTx.txHash} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-void pt-24 pb-24">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-24 right-4 z-[60] px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in ${
            toast.type === 'success' ? 'bg-luxury-green/90' : toast.type === 'error' ? 'bg-luxury-rose/90' : 'bg-luxury-cyan/90'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
            <span className="text-white font-medium">{toast.message}</span>
          </div>
        )}

        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-luxury-green/20 to-luxury-cyan/20 border border-luxury-green/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-luxury-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-display">{t('wallet.title')}</h1>
              <p className="text-white/40 text-lg">{t('wallet.subtitle')}</p>
            </div>
          </div>
        </div>

        {!wallet.connected ? (
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{t('wallet.connectFirst')}</h2>
            <button
              onClick={() => connectWallet('wallet')}
              className="group relative px-8 py-4 rounded-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-purple via-luxury-purple-light to-luxury-cyan" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative flex items-center gap-2 text-white font-semibold">
                <Wallet className="w-5 h-5" />
                {t('wallet.connectWallet')}
              </span>
            </button>
          </div>
        ) : (
          <>
            {/* 资产概览卡片 */}
            <div className="card-luxury rounded-2xl overflow-hidden mb-6 border-luxury-gold/20">
              <div className="px-8 py-6 bg-gradient-to-br from-luxury-gold/5 to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm text-white/40 uppercase tracking-wider">{t('wallet.totalAssets')}</p>
                      <div className={`flex items-center gap-1 text-xs ${MON_PRICE_CHANGE_24H >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                        {MON_PRICE_CHANGE_24H >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {MON_PRICE_CHANGE_24H >= 0 ? '+' : ''}{MON_PRICE_CHANGE_24H}%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <p className="text-5xl font-bold text-gradient-gold font-display">{totalAssets.toLocaleString()}</p>
                      <span className="text-xl text-white/60">$MON</span>
                    </div>
                    <p className="text-lg text-white/40 mt-1">≈ ${toUSDT(totalAssets)} USDT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{t('wallet.address')}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-luxury-cyan font-mono bg-void-light/50 px-3 py-1.5 rounded-lg">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                      </code>
                      <button
                        onClick={copyAddress}
                        className="p-2 rounded-lg bg-void-light/50 text-white/40 hover:text-white hover:bg-void-light transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-void-light/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 mb-2">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">{t('wallet.available')}</span>
                    </div>
                    <p className="text-2xl font-bold text-luxury-green font-mono">{wallet.balance.toLocaleString()}</p>
                    <p className="text-xs text-white/40 mt-1">≈ ${toUSDT(wallet.balance)} USDT</p>
                  </div>

                  <div className="bg-void-light/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">{t('wallet.locked')}</span>
                    </div>
                    <p className="text-2xl font-bold text-luxury-amber font-mono">{agentsTotalBalance.toLocaleString()}</p>
                    <p className="text-xs text-white/40 mt-1">≈ ${toUSDT(agentsTotalBalance)} USDT</p>
                  </div>

                  <div className="bg-void-light/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 mb-2">
                      <PieChart className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">{t('wallet.agents')}</span>
                    </div>
                    <p className="text-2xl font-bold text-luxury-purple font-mono">{myAgents.length}</p>
                    <p className="text-xs text-white/40 mt-1">{t('wallet.totalValue')} {toUSDT(agentsTotalBalance)} USDT</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setShowDepositModal(true)}
                className="group p-6 card-luxury rounded-2xl text-left transition-all hover:border-luxury-green/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-luxury-green/10 border border-luxury-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ArrowDownRight className="w-7 h-7 text-luxury-green" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">{t('wallet.deposit')}</p>
                <p className="text-sm text-white/40">{t('wallet.depositDesc')}</p>
              </button>

              <button
                onClick={() => setShowSwapModal(true)}
                className="group p-6 card-luxury rounded-2xl text-left transition-all hover:border-luxury-gold/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-7 h-7 text-luxury-gold" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">{t('wallet.swap')}</p>
                <p className="text-sm text-white/40">{t('wallet.swapDesc')}</p>
              </button>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="group p-6 card-luxury rounded-2xl text-left transition-all hover:border-luxury-amber/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-luxury-amber/10 border border-luxury-amber/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-7 h-7 text-luxury-amber" />
                </div>
                <p className="text-lg font-semibold text-white mb-1">{t('wallet.withdraw')}</p>
                <p className="text-sm text-white/40">{t('wallet.withdrawDesc')}</p>
              </button>
            </div>

            {/* NFT 展示模块 */}
            <div className="card-luxury rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-luxury-purple" />
                  {t('wallet.myNFT')}
                  <span className="text-xs px-2 py-0.5 bg-luxury-purple/20 rounded-full text-luxury-purple">{nfts.length}</span>
                </h3>
                <button className="text-sm text-luxury-cyan hover:text-luxury-cyan-light flex items-center gap-1">
                  {t('wallet.viewAll')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => { setSelectedNFT(nft); setShowNFTDetailModal(true); }}
                    className="group relative bg-void-light rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(nft.rarity)} opacity-0 group-hover:opacity-30 rounded-xl transition-opacity`} />
                    <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-void">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium text-white text-center mb-0.5 truncate">{nft.name}</p>
                    <p className="text-[10px] text-white/40 text-center capitalize">{nft.rarity}</p>
                    <p className="text-xs font-bold text-luxury-gold font-mono text-center mt-1">{nft.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 邀请好友模块 */}
            <div className="card-luxury rounded-2xl p-6 mb-6 bg-gradient-to-br from-luxury-purple/10 to-luxury-cyan/10 border-luxury-purple/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-luxury-purple flex items-center justify-center">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-luxury-cyan" />
                      {t('wallet.inviteFriends')}
                    </h3>
                    <p className="text-sm text-white/60">{t('wallet.inviteDesc').replace('100 $MON', '<span class="text-luxury-gold font-bold">100 $MON</span>')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteDetailModal(true)}
                  className="px-6 py-3 rounded-xl bg-luxury-cyan text-white font-semibold hover:bg-luxury-cyan/90 transition-colors"
                >
                  {t('wallet.viewDetails')}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-void-light rounded-xl px-4 py-3 border border-white/10">
                    <p className="text-xs text-white/40 mb-1">{t('wallet.inviteCode')}</p>
                    <p className="text-lg font-mono text-white">AI2024VIP</p>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="px-6 py-3 rounded-xl bg-void-light border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    {t('common.copy')}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-void-light/50 rounded-xl">
                    <p className="text-2xl font-bold text-luxury-cyan">{inviteRecords.length}</p>
                    <p className="text-xs text-white/40">{t('wallet.invited')}</p>
                  </div>
                  <div className="text-center p-3 bg-void-light/50 rounded-xl">
                    <p className="text-2xl font-bold text-luxury-gold">{inviteRecords.reduce((sum, r) => sum + r.reward, 0)}</p>
                    <p className="text-xs text-white/40">{t('wallet.earned')}</p>
                  </div>
                  <div className="text-center p-3 bg-void-light/50 rounded-xl">
                    <p className="text-2xl font-bold text-luxury-green">{inviteRecords.filter(r => r.isActive).length}</p>
                    <p className="text-xs text-white/40">{t('wallet.activeFriends')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 交易记录 */}
            <div className="card-luxury rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-luxury-purple" />
                    {t('wallet.transactions')}
                  </h3>
                  <button className="text-sm text-luxury-cyan hover:text-luxury-cyan-light flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {t('wallet.export')}
                  </button>
                </div>

                {/* Filter & Search */}
                <div className="flex gap-3">
                  <div className="flex gap-2">
                    {(['all', 'deposit', 'withdraw', 'swap', 'battle'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setTxFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          txFilter === type
                            ? 'bg-luxury-cyan text-white'
                            : 'bg-void-light text-white/60 hover:text-white'
                        }`}
                      >
                        {type === 'all' ? t('wallet.all') : type === 'deposit' ? t('wallet.deposit') : type === 'withdraw' ? t('wallet.withdraw') : type === 'swap' ? t('wallet.swap') : t('arena.battles')}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      placeholder={t('wallet.search')}
                      className="w-full bg-void-light border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-luxury-cyan focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {filteredTransactions.slice(0, 5).map(tx => {
                  const config = getTransactionIcon(tx.type);
                  const Icon = config.icon;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => { setSelectedTx(tx); setShowTxDetailModal(true); }}
                      className="p-4 flex items-center justify-between hover:bg-void-light/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{tx.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-white/40">{formatTime(tx.timestamp)}</p>
                            {tx.status === 'pending' && <span className="text-[10px] px-1.5 py-0.5 bg-luxury-gold/20 text-luxury-gold rounded">{t('wallet.pending')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold font-mono block ${tx.amount >= 0 ? 'text-luxury-green' : 'text-luxury-rose'}`}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount}
                        </span>
                        <span className="text-xs text-white/40">≈ ${toUSDT(Math.abs(tx.amount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTransactions.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-void-light/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40">{t('wallet.noTransactions')}</p>
                </div>
              )}

              {filteredTransactions.length > 5 && (
                <div className="p-4 text-center border-t border-white/5">
                  <button className="text-sm text-luxury-cyan hover:text-luxury-cyan-light">
                    {t('common.loadMore')}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Modals */}
      {showDepositModal && <DepositModal />}
      {showSwapModal && <SwapModal />}
      {showWithdrawModal && <WithdrawModal />}
      {showNFTDetailModal && <NFTDetailModal />}
      {showInviteDetailModal && <InviteDetailModal />}
      {showTxDetailModal && <TxDetailModal />}
    </div>
  );
};

export default WalletPage;
