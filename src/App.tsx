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
import PredictionMarket from './pages/PredictionMarket';
import NotificationContainer from './components/NotificationContainer';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const initialized = useRef(false);

  // 启动锦标赛定时器和自动战斗系统
  useEffect(() => {
    // 防止 StrictMode 导致的重复初始化
    if (initialized.current) return;
    initialized.current = true;

    const { startTournamentScheduler, startAutoBattleSystem, initializeArena } = useGameStore.getState();
    initializeArena(); // 初始化1000个系统agents
    startTournamentScheduler();
    startAutoBattleSystem(); // 启动后台自动战斗系统

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
          <Route path="/predict" element={<PredictionMarket />} />
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
