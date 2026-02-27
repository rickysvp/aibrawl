import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Arena from './pages/Arena';
import Tournament from './pages/Tournament';
import Squad from './pages/Squad';
import Wallet from './pages/Wallet';
import Leaderboard from './pages/Leaderboard';
import LiquidityMining from './pages/LiquidityMining';
import NotificationContainer from './components/NotificationContainer';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const initialized = useRef(false);

  // 启动锦标赛定时器和自动战斗系统
  useEffect(() => {
    // 防止 StrictMode 导致的重复初始化
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const { 
        startTournamentScheduler, 
        startAutoBattleSystem, 
        initializeArena,
        wallet,
        connectWallet
      } = useGameStore.getState();
      
      // 初始化1000个系统agents
      await initializeArena();
      
      // 如果用户已登录（从localStorage恢复的钱包状态），重新加载用户数据
      if (wallet.connected && wallet.address) {
        console.log('[App] 检测到已登录用户，重新加载数据...');
        // 使用已保存的地址重新连接，加载用户数据
        const savedNickname = localStorage.getItem('aibrawl_nickname') || 'User';
        await connectWallet(savedNickname, 'wallet');
      }
      
      startTournamentScheduler();
      startAutoBattleSystem(); // 启动后台自动战斗系统
    };
    
    init();

    return () => {
      const { stopAutoBattleSystem } = useGameStore.getState();
      stopAutoBattleSystem();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cyber-bg">
        <Header />
        <Routes>
          <Route path="/" element={<Arena />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/mining" element={<LiquidityMining />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
        <TabBar />
        <NotificationContainer />
      </div>
    </BrowserRouter>
  );
};

export default App;
