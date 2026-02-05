import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TournamentMatch, Agent } from '../types';
import { Sword, Shield, Zap, Heart, Crosshair } from 'lucide-react';

interface TournamentLiveMatchProps {
  match: TournamentMatch;
  onComplete?: (winnerId: string) => void;
  isLive?: boolean;
}

interface BattleAction {
  id: string;
  attacker: Agent;
  defender: Agent;
  damage: number;
  isCrit: boolean;
  timestamp: number;
}

const TournamentLiveMatch: React.FC<TournamentLiveMatchProps> = ({ match, onComplete, isLive = true }) => {
  const [agentA, setAgentA] = useState<Agent | undefined>(match.agentA);
  const [agentB, setAgentB] = useState<Agent | undefined>(match.agentB);
  const [winner, setWinner] = useState<string | null>(match.winnerId || null);
  const [actions, setActions] = useState<BattleAction[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isBattling, setIsBattling] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // 模拟战斗
  const simulateBattle = async () => {
    if (!agentA || !agentB || winner) return;

    setIsBattling(true);
    let hpA = agentA.hp;
    let hpB = agentB.hp;
    let turn = 0;
    const maxTurns = 20;
    const battleActions: BattleAction[] = [];

    while (hpA > 0 && hpB > 0 && turn < maxTurns) {
      turn++;
      setCurrentTurn(turn);

      // 决定攻击方
      const attacker = turn % 2 === 1 ? agentA : agentB;
      const defender = turn % 2 === 1 ? agentB : agentA;
      let currentHpA = turn % 2 === 1 ? hpA : hpB;
      let currentHpB = turn % 2 === 1 ? hpB : hpA;

      // 计算伤害
      const baseDamage = attacker.attack - defender.defense * 0.5;
      const randomFactor = 0.8 + Math.random() * 0.4;
      const isCrit = Math.random() < 0.15;
      const damage = Math.max(1, Math.floor(baseDamage * randomFactor * (isCrit ? 2 : 1)));

      // 更新血量
      if (turn % 2 === 1) {
        hpB = Math.max(0, hpB - damage);
      } else {
        hpA = Math.max(0, hpA - damage);
      }

      // 记录动作
      const action: BattleAction = {
        id: `action-${turn}`,
        attacker,
        defender,
        damage,
        isCrit,
        timestamp: Date.now(),
      };
      battleActions.push(action);
      setActions([...battleActions]);

      // 延迟显示
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // 决定胜者
    const winnerId = hpA > 0 ? agentA.id : agentB.id;
    setWinner(winnerId);
    setIsBattling(false);
    setShowResult(true);

    if (onComplete) {
      onComplete(winnerId);
    }
  };

  // 如果是实时比赛，自动开始
  useEffect(() => {
    if (isLive && !winner && !isBattling) {
      simulateBattle();
    }
  }, [isLive]);

  if (!agentA || !agentB) {
    return (
      <div className="flex items-center justify-center p-8 bg-void-light/20 rounded-xl">
        <span className="text-white/40">Waiting for opponents...</span>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-void-panel to-void-light/20 rounded-2xl p-6 border border-white/10 overflow-hidden">
      {/* 背景特效 */}
      <AnimatePresence>
        {isBattling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-luxury-rose/5 via-transparent to-luxury-cyan/5 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 回合数 */}
      {isBattling && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <motion.div
            key={currentTurn}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-4 py-1 rounded-full bg-luxury-amber/20 border border-luxury-amber/30"
          >
            <span className="text-luxury-amber font-bold">Round {currentTurn}</span>
          </motion.div>
        </div>
      )}

      {/* 战斗区域 */}
      <div className="flex items-center justify-between gap-8 mt-8">
        {/* Agent A */}
        <motion.div
          className={`flex-1 ${winner === agentB.id ? 'opacity-40' : ''}`}
          animate={{
            x: actions.length > 0 && actions[actions.length - 1].attacker.id === agentA.id ? [0, 20, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <AgentCard agent={agentA} isWinner={winner === agentA.id} isAttacker={actions.length > 0 && actions[actions.length - 1].attacker.id === agentA.id} />
        </motion.div>

        {/* VS */}
        <div className="relative">
          {isBattling ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-luxury-rose to-luxury-cyan flex items-center justify-center"
            >
              <Sword className="w-8 h-8 text-white" />
            </motion.div>
          ) : winner ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                winner === agentA.id ? 'bg-luxury-green' : 'bg-luxury-rose'
              }`}
            >
              {winner === agentA.id ? (
                <span className="text-2xl font-bold text-white">WIN</span>
              ) : (
                <span className="text-2xl font-bold text-white">LOSE</span>
              )}
            </motion.div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xl font-bold text-white/60">VS</span>
            </div>
          )}
        </div>

        {/* Agent B */}
        <motion.div
          className={`flex-1 ${winner === agentA.id ? 'opacity-40' : ''}`}
          animate={{
            x: actions.length > 0 && actions[actions.length - 1].attacker.id === agentB.id ? [0, -20, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <AgentCard agent={agentB} isWinner={winner === agentB.id} isAttacker={actions.length > 0 && actions[actions.length - 1].attacker.id === agentB.id} />
        </motion.div>
      </div>

      {/* 战斗日志 */}
      <AnimatePresence>
        {actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-void-light/30 rounded-xl max-h-40 overflow-y-auto"
          >
            <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">Battle Log</h4>
            <div className="space-y-1">
              {actions.slice(-5).map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-white/60">{action.attacker.name}</span>
                  <span className="text-luxury-rose">attacks</span>
                  <span className="text-white/60">{action.defender.name}</span>
                  <span className="text-luxury-rose font-bold">-{action.damage}</span>
                  {action.isCrit && (
                    <span className="px-2 py-0.5 rounded bg-luxury-gold/20 text-luxury-gold text-xs">CRIT!</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 结果展示 */}
      <AnimatePresence>
        {showResult && winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-4xl font-bold text-luxury-gold mb-2"
              >
                🏆 WINNER
              </motion.div>
              <div className="text-xl text-white">
                {winner === agentA.id ? agentA.name : agentB.name}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Agent卡片组件
const AgentCard: React.FC<{ agent: Agent; isWinner: boolean; isAttacker: boolean }> = ({
  agent,
  isWinner,
  isAttacker,
}) => {
  return (
    <div
      className={`relative p-4 rounded-xl border transition-all ${
        isWinner
          ? 'bg-luxury-green/10 border-luxury-green/30'
          : isAttacker
          ? 'bg-luxury-rose/10 border-luxury-rose/30'
          : 'bg-void-light/30 border-white/10'
      }`}
    >
      {/* Agent头像 */}
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="w-12 h-12 rounded-xl"
          style={{ backgroundColor: agent.color }}
          animate={isAttacker ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        />
        <div>
          <p className="text-white font-medium">{agent.name}</p>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Sword className="w-3 h-3" />
              {agent.attack}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {agent.defense}
            </span>
          </div>
        </div>
      </div>

      {/* 血条 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-luxury-rose" />
          <div className="flex-1 h-2 bg-void-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-luxury-rose rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${(agent.hp / agent.maxHp) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-white/60">
            {agent.hp}/{agent.maxHp}
          </span>
        </div>
      </div>

      {/* 胜利标识 */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-luxury-gold flex items-center justify-center"
        >
          <span className="text-lg">👑</span>
        </motion.div>
      )}
    </div>
  );
};

export default TournamentLiveMatch;
