import React, { useEffect, useRef, useState } from 'react';
import { Agent, Projectile, DamageNumber, CoinTransfer, BalanceChange } from '../types';
import { useGameStore } from '../store/gameStore';
import PixelAgent from './PixelAgent';
import { Swords, Users, Timer, Trophy, Coins, TrendingDown, TrendingUp } from 'lucide-react';

interface ArenaCanvasProps {
  participants: Agent[];
  phase: string;
  countdown: number;
  selectedSlots: number[];
}

const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  participants,
  phase,
  countdown,
  selectedSlots
}) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [coinTransfers, setCoinTransfers] = useState<CoinTransfer[]>([]);
  const [balanceChanges, setBalanceChanges] = useState<BalanceChange[]>([]);
  const [explosions, setExplosions] = useState<{id: string; x: number; y: number; timestamp: number}[]>([]);
  const [attackingAgents, setAttackingAgents] = useState<Set<string>>(new Set());
  const [hurtAgents, setHurtAgents] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const addBattleLog = useGameStore(state => state.addBattleLog);
  const updateParticipant = useGameStore(state => state.updateParticipant);
  const roundNumber = useGameStore(state => state.arena.roundNumber);
  
  // 战斗动画循环 - 使用余额作为血量
  useEffect(() => {
    if (phase !== 'fighting' || participants.length < 2) return;

    const battleInterval = setInterval(() => {
      const aliveAgents = participants.filter(a => a.balance > 0);
      if (aliveAgents.length < 2) return;

      const attackerIndex = Math.floor(Math.random() * aliveAgents.length);
      let targetIndex = Math.floor(Math.random() * aliveAgents.length);
      while (targetIndex === attackerIndex) {
        targetIndex = Math.floor(Math.random() * aliveAgents.length);
      }

      const attacker = aliveAgents[attackerIndex];
      const target = aliveAgents[targetIndex];

      const attackerSlot = participants.findIndex(p => p.id === attacker.id);
      const targetSlot = participants.findIndex(p => p.id === target.id);

      if (attackerSlot === -1 || targetSlot === -1) return;

      const attackerPos = getSlotPosition(attackerSlot, 10);
      const targetPos = getSlotPosition(targetSlot, 10);

      // 设置攻击动画
      setAttackingAgents(prev => new Set(prev).add(attacker.id));
      setTimeout(() => {
        setAttackingAgents(prev => {
          const next = new Set(prev);
          next.delete(attacker.id);
          return next;
        });
      }, 200);

      // 添加子弹
      const projectile: Projectile = {
        id: Math.random().toString(36).substr(2, 9),
        fromX: attackerPos.x,
        fromY: attackerPos.y,
        toX: targetPos.x,
        toY: targetPos.y,
        color: attacker.color,
        progress: 0,
      };
      setProjectiles(prev => [...prev, projectile]);

      // 延迟计算伤害
      setTimeout(() => {
        const isCrit = Math.random() > 0.8;
        const baseDamage = attacker.attack - target.defense + Math.floor(Math.random() * 10);
        const damage = Math.max(1, isCrit ? Math.floor(baseDamage * 1.5) : baseDamage);

        // 计算掠夺资金 (造成伤害的数值)
        const lootAmount = damage;
        const newTargetBalance = Math.max(0, target.balance - lootAmount);
        const newAttackerBalance = attacker.balance + lootAmount;

        // 设置受伤动画
        setHurtAgents(prev => new Set(prev).add(target.id));
        setTimeout(() => {
          setHurtAgents(prev => {
            const next = new Set(prev);
            next.delete(target.id);
            return next;
          });
        }, 300);

        // 添加伤害数字
        setDamageNumbers(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: targetPos.x,
          y: targetPos.y,
          damage,
          isCrit,
          timestamp: Date.now(),
        }]);

        // 添加目标余额减少效果（红色）
        setBalanceChanges(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: targetPos.x,
          y: targetPos.y,
          amount: lootAmount,
          isGain: false,
          timestamp: Date.now(),
        }]);

        // 添加攻击者余额增加效果（绿色）
        setBalanceChanges(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: attackerPos.x,
          y: attackerPos.y,
          amount: lootAmount,
          isGain: true,
          timestamp: Date.now(),
        }]);

        // 更新目标余额（减少）
        updateParticipant(target.id, { balance: newTargetBalance, status: newTargetBalance <= 0 ? 'dead' : 'fighting' });

        // 更新攻击者余额（增加）
        updateParticipant(attacker.id, { balance: newAttackerBalance });

        // 击杀效果
        if (newTargetBalance <= 0) {
          setExplosions(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            x: targetPos.x,
            y: targetPos.y,
            timestamp: Date.now(),
          }]);

          addBattleLog({
            type: 'kill',
            attacker,
            defender: target,
            damage,
            message: `${attacker.name} 击杀了 ${target.name}！`,
            isHighlight: true,
          });
          updateParticipant(attacker.id, { kills: attacker.kills + 1 });
        } else {
          addBattleLog({
            type: 'attack',
            attacker,
            defender: target,
            damage,
            message: `${attacker.name} 掠夺了 ${target.name} ${lootAmount} $MON`,
          });
        }
      }, 200);
    }, 400);

    return () => clearInterval(battleInterval);
  }, [phase, participants, addBattleLog, updateParticipant]);
  
  // 子弹动画
  useEffect(() => {
    const animateProjectiles = () => {
      setProjectiles(prev => 
        prev
          .map(p => ({ ...p, progress: p.progress + 0.15 }))
          .filter(p => p.progress < 1)
      );
      animationRef.current = requestAnimationFrame(animateProjectiles);
    };
    
    animationRef.current = requestAnimationFrame(animateProjectiles);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // 清理伤害数字、资金转移、余额变化和爆炸效果
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setDamageNumbers(prev => prev.filter(d => now - d.timestamp < 1000));
      setCoinTransfers(prev => prev.filter(c => now - c.timestamp < 1500));
      setBalanceChanges(prev => prev.filter(b => now - b.timestamp < 1200));
      setExplosions(prev => prev.filter(e => now - e.timestamp < 500));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);
  
  // 获取坑位位置（百分比）
  const getSlotPosition = (index: number, total: number) => {
    const angle = (index / Math.max(total, 10)) * Math.PI * 2 - Math.PI / 2;
    const radius = 38;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  };
  
  const slotPositions = Array.from({ length: 10 }, (_, i) => getSlotPosition(i, 10));

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 30% 30%, rgba(255, 215, 0, 0.05) 0%, transparent 40%),
          linear-gradient(180deg, #0a0a10 0%, #050508 100%)
        `,
      }}
    >
      {/* 六边形网格背景 */}
      <div className="absolute inset-0 hex-grid opacity-50" />
      
      {/* 竞技场背景装饰 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* 外圈 */}
        <div className="absolute w-[90%] h-[90%] border border-luxury-purple/10 rounded-full" />
        <div className="absolute w-[90%] h-[90%] border border-luxury-purple/5 rounded-full animate-spin-slow" style={{ animationDuration: '60s' }} />
        
        {/* 中圈 */}
        <div className="absolute w-[70%] h-[70%] border border-luxury-cyan/10 rounded-full" />
        <div className="absolute w-[70%] h-[70%] border border-luxury-cyan/5 rounded-full animate-spin-slow" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />
        
        {/* 内圈 */}
        <div className="absolute w-[45%] h-[45%] border border-luxury-gold/10 rounded-full" />
        <div className="absolute w-[45%] h-[45%] border border-luxury-gold/5 rounded-full animate-spin-slow" style={{ animationDuration: '30s' }} />
        
        {/* 中心标志 */}
        <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-luxury-purple/10 to-luxury-cyan/10 border border-luxury-purple/20 flex items-center justify-center">
          <Swords className="w-10 h-10 text-luxury-purple/30" />
        </div>
        
        {/* 装饰线条 */}
        {[0, 45, 90, 135].map(angle => (
          <div 
            key={angle}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-luxury-purple/10 to-transparent"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        ))}
      </div>
      
      {/* 坑位 */}
      {slotPositions.map((pos, index) => {
        const participant = participants[index];
        const isSelected = selectedSlots.includes(index);
        const isLit = phase === 'selecting' && isSelected;
        const isAttacking = participant && attackingAgents.has(participant.id);
        const isHurt = participant && hurtAgents.has(participant.id);
        const isDead = participant && participant.hp <= 0;
        const isMyAgent = participant?.isPlayer;
        const isJustSeated = phase === 'selecting' && isSelected && participant;

        return (
          <div
            key={index}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
              isLit ? 'scale-110 z-10' : 'scale-100'
            } ${isMyAgent ? 'z-20' : 'z-10'}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {/* 选中光环 */}
            {isLit && (
              <div className="absolute inset-0 w-20 h-20 -translate-x-2 -translate-y-2">
                <div className="absolute inset-0 bg-luxury-gold/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-luxury-gold/10 rounded-full animate-pulse" />
              </div>
            )}

            {/* 落座动画光环 */}
            {isJustSeated && (
              <div className="absolute inset-0 w-20 h-20 -translate-x-2 -translate-y-2 pointer-events-none">
                <div className="absolute inset-0 bg-luxury-gold/40 rounded-full animate-ping" style={{ animationDuration: '0.5s' }} />
                <div className="absolute -inset-2 border-4 border-luxury-gold/60 rounded-3xl animate-pulse" style={{ animationDuration: '0.3s' }} />
              </div>
            )}

            {/* 用户 Agent 特殊光环 */}
            {isMyAgent && !isDead && (
              <div className="absolute inset-0 w-20 h-20 -translate-x-2 -translate-y-2 pointer-events-none">
                <div className="absolute inset-0 bg-luxury-cyan/30 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-1 border-2 border-luxury-cyan/50 rounded-2xl animate-ping" style={{ animationDuration: '3s' }} />
              </div>
            )}

            {/* 坑位底座 */}
            <div
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isLit
                  ? 'bg-luxury-gold/20 shadow-lg shadow-luxury-gold/30'
                  : isMyAgent
                    ? 'bg-luxury-cyan/20 shadow-lg shadow-luxury-cyan/30'
                    : 'bg-void-panel/80'
              } ${
                participant
                  ? 'border-2'
                  : 'border border-dashed border-white/10'
              } ${
                isDead ? 'opacity-40 grayscale' : ''
              } ${
                isHurt ? 'animate-shake' : ''
              } ${
                isJustSeated ? 'animate-bounce' : ''
              }`}
              style={{
                borderColor: isMyAgent ? '#22d3ee' : (participant?.color || 'rgba(255,255,255,0.1)'),
                boxShadow: participant && !isDead
                  ? isMyAgent
                    ? '0 0 30px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.2)'
                    : isJustSeated
                      ? '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.3)'
                      : `0 0 20px ${participant.color}30, inset 0 0 20px ${participant.color}10`
                  : 'none'
              }}
            >
              {participant ? (
                <div className={`transition-all duration-300 ${isJustSeated ? 'scale-125' : 'scale-100'}`}>
                  <PixelAgent
                    agent={participant}
                    size={40}
                    showBalance={phase === 'fighting' || phase === 'settlement'}
                    isAttacking={isAttacking}
                    isHurt={isHurt}
                  />
                </div>
              ) : (
                <span className="text-white/20 text-xl font-mono">{index + 1}</span>
              )}

              {/* 死亡标记 */}
              {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-void/60 rounded-2xl">
                  <span className="text-2xl">💀</span>
                </div>
              )}

              {/* 我的 Agent 标记 */}
              {isMyAgent && !isDead && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-luxury-cyan rounded-full flex items-center justify-center border-2 border-void">
                  <span className="text-[8px] font-bold text-void">我</span>
                </div>
              )}
            </div>
            
            {/* Agent 名称 */}
            {participant && (
              <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span 
                  className={`text-[10px] font-medium px-2 py-1 rounded-lg border ${
                    isMyAgent 
                      ? 'bg-luxury-cyan/20 border-luxury-cyan/50 text-luxury-cyan' 
                      : 'bg-void-panel/80 border-white/5'
                  }`}
                  style={{ 
                    color: isDead ? '#666' : (isMyAgent ? '#22d3ee' : participant.color),
                    textShadow: isDead ? 'none' : `0 0 10px ${isMyAgent ? '#22d3ee' : participant.color}60`
                  }}
                >
                  {isMyAgent ? '👤 ' : ''}{participant.name.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
        );
      })}
      
      {/* 子弹特效 */}
      {projectiles.map(p => {
        const x = p.fromX + (p.toX - p.fromX) * p.progress;
        const y = p.fromY + (p.toY - p.fromY) * p.progress;
        return (
          <div
            key={p.id}
            className="absolute pointer-events-none z-20"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* 子弹核心 */}
            <div 
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: p.color,
                boxShadow: `0 0 15px ${p.color}, 0 0 30px ${p.color}, 0 0 45px ${p.color}`,
              }}
            />
            {/* 子弹尾迹 */}
            <div 
              className="absolute w-8 h-1.5 -left-8 top-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${p.color})`,
                opacity: 0.7,
              }}
            />
          </div>
        );
      })}
      
      {/* 伤害数字 */}
      {damageNumbers.map(d => (
        <div
          key={d.id}
          className="absolute damage-number font-bold pointer-events-none z-30"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            color: d.isCrit ? '#f43f5e' : '#ffffff',
            fontSize: d.isCrit ? '20px' : '16px',
            textShadow: d.isCrit
              ? '0 0 20px #f43f5e, 0 0 40px #f43f5e'
              : '0 0 10px #000, 2px 2px 0 #000',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {d.isCrit && <span className="text-luxury-gold text-sm block text-center">暴击!</span>}
          <span className="font-mono">-{d.damage}</span>
        </div>
      ))}

      {/* 资金转移效果 */}
      {coinTransfers.map(c => (
        <div
          key={c.id}
          className="absolute pointer-events-none z-35 animate-coin-float"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: 'coin-float 1.5s ease-out forwards',
          }}
        >
          <div className="flex items-center gap-1 bg-luxury-gold/90 text-void px-2 py-1 rounded-full shadow-lg shadow-luxury-gold/50">
            <Coins className="w-3 h-3" />
            <span className="text-xs font-bold font-mono">+{c.amount}</span>
          </div>
        </div>
      ))}

      {/* 余额变化效果 - 绿色加血，红色减血 - 最上层显示 */}
      {balanceChanges.map(b => (
        <div
          key={b.id}
          className="absolute pointer-events-none z-[100]"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: 'balance-change-pop 1.5s ease-out forwards',
          }}
        >
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-2xl border-2 ${
            b.isGain
              ? 'bg-luxury-green text-white border-luxury-green-light shadow-luxury-green/60'
              : 'bg-luxury-rose text-white border-rose-400 shadow-luxury-rose/60'
          }`}>
            {b.isGain ? (
              <TrendingUp className="w-4 h-4 animate-bounce" />
            ) : (
              <TrendingDown className="w-4 h-4 animate-bounce" />
            )}
            <span className="text-sm font-bold font-mono">
              {b.isGain ? '+' : '-'}{b.amount} $MON
            </span>
          </div>
        </div>
      ))}
      
      {/* 爆炸效果 */}
      {explosions.map(e => (
        <div
          key={e.id}
          className="absolute pointer-events-none z-20"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="explosion w-24 h-24 rounded-full bg-gradient-radial from-luxury-gold via-luxury-amber to-transparent opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl animate-ping">
            💥
          </div>
        </div>
      ))}
      
      {/* 倒计时显示 - 只在 countdown 阶段显示 */}
      {phase === 'countdown' && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm z-40">
          <div className="text-center">
            <div 
              className="text-9xl font-bold text-gradient font-display animate-pulse"
              style={{ 
                textShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
                animation: 'pulse-glow 1s ease-in-out infinite'
              }}
            >
              {countdown}
            </div>
            <div className="text-lg text-white/60 mt-6 font-medium tracking-wide">
              战斗即将开始
            </div>
          </div>
        </div>
      )}
      
      {/* 选择参赛者提示 */}
      {phase === 'selecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/60 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="text-2xl font-bold text-luxury-gold font-display">
              正在选择参赛者
            </div>
            <div className="text-sm text-white/40 mt-2">
              随机抽取 10 名选手
            </div>
          </div>
        </div>
      )}
      
      {/* 等待状态 */}
      {phase === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-void-panel/80 border border-luxury-purple/20 flex items-center justify-center mb-4 mx-auto">
              <div className="w-3 h-3 bg-luxury-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-luxury-cyan rounded-full animate-bounce mx-2" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xl text-white/60 font-medium">等待下一轮</p>
          </div>
        </div>
      )}
      
      {/* 战斗中状态指示器 */}
      {phase === 'fighting' && (
        <>
          {/* 战斗倒计时 */}
          <div className="absolute top-5 right-5 glass rounded-xl px-4 py-2 border border-luxury-cyan/20 z-20">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-luxury-cyan animate-pulse" />
              <span className="text-lg font-bold text-luxury-cyan font-mono">{countdown}s</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArenaCanvas;
