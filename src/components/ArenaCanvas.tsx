import React, { useEffect, useRef, useState } from 'react';
import { Projectile, CoinTransfer, BalanceChange } from '../types';
import { useGameStore } from '../store/gameStore';
import PixelAgent from './PixelAgent';
import { Swords, Timer, Coins } from 'lucide-react';

interface ArenaCanvasProps {
  phase: string;
  countdown: number;
  selectedSlots: number[];
}

const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  phase,
  countdown,
  selectedSlots
}) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [coinTransfers, setCoinTransfers] = useState<CoinTransfer[]>([]);
  const [balanceChanges, setBalanceChanges] = useState<BalanceChange[]>([]);
  const [explosions, setExplosions] = useState<{id: string; x: number; y: number; timestamp: number}[]>([]);
  const [attackingAgents, setAttackingAgents] = useState<Set<string>>(new Set());
  const [hurtAgents, setHurtAgents] = useState<Set<string>>(new Set());
  const [defendingAgents, setDefendingAgents] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // 直接从 store 获取 participants，确保实时更新
  const participants = useGameStore(state => state.arena.participants);
  const addBattleLog = useGameStore(state => state.addBattleLog);
  const updateParticipant = useGameStore(state => state.updateParticipant);
  
  // 战斗动画循环 - 使用余额作为血量
  useEffect(() => {
    if (phase !== 'fighting') return;

    // 计算内外侧位置（中心为 50, 50）
    const getInnerOuterPosition = (pos: {x: number, y: number}, isInner: boolean) => {
      const centerX = 50;
      const centerY = 50;
      const offset = isInner ? -8 : 8; // 内侧向中心偏移8%，外侧远离中心8%
      const dx = pos.x - centerX;
      const dy = pos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) return pos;
      const ratio = (distance + offset) / distance;
      return {
        x: centerX + dx * ratio,
        y: centerY + dy * ratio,
      };
    };

    const battleInterval = setInterval(() => {
      // 每次从 store 获取最新的 participants 状态
      const currentParticipants = useGameStore.getState().arena.participants;
      const aliveAgents = currentParticipants.filter(a => a.balance > 0);
      if (aliveAgents.length < 2) return;

      // 随机决定是攻击还是防御 (15% 概率防御)
      if (Math.random() < 0.15) {
        // 防御逻辑
        const defenderIndex = Math.floor(Math.random() * aliveAgents.length);
        const defender = aliveAgents[defenderIndex];
        
        setDefendingAgents(prev => new Set(prev).add(defender.id));
        
        // 显示防御飘字
        const defenderSlot = currentParticipants.findIndex(p => p.id === defender.id);
        if (defenderSlot !== -1) {
          const defenderPos = getSlotPosition(defenderSlot);
          // 稍微向外偏移
          const defenderOuterPos = getInnerOuterPosition(defenderPos, false);
          
          setBalanceChanges(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            x: defenderOuterPos.x,
            y: defenderOuterPos.y - 5, // 稍微高一点
            amount: 0, // 特殊标记，0表示显示文本
            text: 'SHIELD UP!', // 需要在 BalanceChange 类型中添加 text 字段，或者这里借用 amount
            isGain: true, // 绿色
            timestamp: Date.now(),
          }]);
        }

        setTimeout(() => {
          setDefendingAgents(prev => {
            const next = new Set(prev);
            next.delete(defender.id);
            return next;
          });
        }, 2000); // 防御持续 2 秒
        return; // 本次循环只做防御，不攻击
      }

      const attackerIndex = Math.floor(Math.random() * aliveAgents.length);
      let targetIndex = Math.floor(Math.random() * aliveAgents.length);
      while (targetIndex === attackerIndex) {
        targetIndex = Math.floor(Math.random() * aliveAgents.length);
      }

      const attacker = aliveAgents[attackerIndex];
      const target = aliveAgents[targetIndex];

      const attackerSlot = currentParticipants.findIndex(p => p.id === attacker.id);
      const targetSlot = currentParticipants.findIndex(p => p.id === target.id);

      if (attackerSlot === -1 || targetSlot === -1) return;

      const attackerPos = getSlotPosition(attackerSlot);
      const targetPos = getSlotPosition(targetSlot);

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
        // 再次获取最新状态
        const latestParticipants = useGameStore.getState().arena.participants;
        const latestAttacker = latestParticipants.find(p => p.id === attacker.id);
        const latestTarget = latestParticipants.find(p => p.id === target.id);
        
        if (!latestAttacker || !latestTarget) return;
        
        const isCrit = Math.random() > 0.8;
        let baseDamage = latestAttacker.attack - latestTarget.defense + Math.floor(Math.random() * 10);
        
        // 检查目标是否防御中
        const isDefending = defendingAgents.has(target.id);
        if (isDefending) {
          baseDamage = Math.floor(baseDamage * 0.5); // 防御减少 50% 伤害
        }

        const damage = Math.max(1, isCrit ? Math.floor(baseDamage * 1.5) : baseDamage);

        // 计算掠夺资金 (实际从目标身上拿走的金额，不能超过目标余额)
        const lootAmount = Math.min(damage, latestTarget.balance);
        const newTargetBalance = latestTarget.balance - lootAmount;
        const newAttackerBalance = latestAttacker.balance + lootAmount;

        // 设置受伤动画
        setHurtAgents(prev => new Set(prev).add(target.id));
        setTimeout(() => {
          setHurtAgents(prev => {
            const next = new Set(prev);
            next.delete(target.id);
            return next;
          });
        }, 300);



        // 添加目标余额减少效果（红色 - 外侧显示）
        const targetOuterPos = getInnerOuterPosition(targetPos, false);
        setBalanceChanges(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: targetOuterPos.x,
          y: targetOuterPos.y,
          amount: lootAmount,
          isGain: false,
          text: isDefending ? `Blocked! -${lootAmount}` : undefined,
          timestamp: Date.now(),
        }]);

        // 添加攻击者余额增加效果（绿色 - 内侧显示）
        const attackerInnerPos = getInnerOuterPosition(attackerPos, true);
        setBalanceChanges(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          x: attackerInnerPos.x,
          y: attackerInnerPos.y,
          amount: lootAmount,
          isGain: true,
          timestamp: Date.now(),
        }]);

        // 更新目标余额（减少）
        const isEliminated = newTargetBalance <= 0;
        updateParticipant(target.id, { 
          balance: newTargetBalance, 
          status: isEliminated ? 'eliminated' : 'fighting' 
        });

        // 更新攻击者余额（增加）
        updateParticipant(latestAttacker.id, { balance: newAttackerBalance });

        // 淘汰效果
        if (isEliminated) {
          setExplosions(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            x: targetPos.x,
            y: targetPos.y,
            timestamp: Date.now(),
          }]);

          addBattleLog({
            type: 'eliminate',
            attacker: latestAttacker,
            defender: latestTarget,
            message: `${latestAttacker.name} 淘汰了 ${latestTarget.name}！`,
            isHighlight: true,
          });
        } else {
          addBattleLog({
            type: 'attack',
            attacker: latestAttacker,
            defender: latestTarget,
            message: `${latestAttacker.name} 掠夺了 ${latestTarget.name} +${lootAmount} $MON`,
          });
        }
      }, 200);
    }, 400);

    return () => clearInterval(battleInterval);
  }, [phase]);
  
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
  
  // 清理资金转移、余额变化和爆炸效果
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCoinTransfers(prev => prev.filter(c => now - c.timestamp < 1500));
      setBalanceChanges(prev => prev.filter(b => now - b.timestamp < 1200));
      setExplosions(prev => prev.filter(e => now - e.timestamp < 500));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);
  
  // 获取坑位位置（百分比）- 使用椭圆布局避免中间和两边重叠
  const getSlotPosition = (index: number) => {
    // 10个位置分成上下两行，每行5个
    const positions = [
      // 上行 - 稍微偏上
      { x: 20, y: 30 }, { x: 35, y: 22 }, { x: 50, y: 18 }, { x: 65, y: 22 }, { x: 80, y: 30 },
      // 下行 - 稍微偏下
      { x: 20, y: 70 }, { x: 35, y: 78 }, { x: 50, y: 82 }, { x: 65, y: 78 }, { x: 80, y: 70 },
    ];
    return positions[index] || { x: 50, y: 50 };
  };
  
  const slotPositions = Array.from({ length: 10 }, (_, i) => getSlotPosition(i));

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 40%),
          radial-gradient(ellipse at 80% 20%, rgba(255, 215, 0, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, #0a0a10 0%, #050508 100%)
        `,
      }}
    >
      {/* 虚空料子纹理背景 */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 60%)
          `,
        }}
      />

      {/* 动态粒子效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-luxury-purple/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 六边形网格背景 */}
      <div className="absolute inset-0 hex-grid opacity-30" />

      {/* 竞技场背景装饰 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* 外圈 - 发光效果 */}
        <div className="absolute w-[92%] h-[92%] border border-luxury-purple/20 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.1)]" />
        <div className="absolute w-[92%] h-[92%] border border-luxury-purple/10 rounded-full animate-spin-slow" style={{ animationDuration: '60s' }} />

        {/* 中圈 - 发光效果 */}
        <div className="absolute w-[72%] h-[72%] border border-luxury-cyan/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]" />
        <div className="absolute w-[72%] h-[72%] border border-luxury-cyan/10 rounded-full animate-spin-slow" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />

        {/* 内圈 - 发光效果 */}
        <div className="absolute w-[48%] h-[48%] border border-luxury-gold/20 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.1)]" />
        <div className="absolute w-[48%] h-[48%] border border-luxury-gold/10 rounded-full animate-spin-slow" style={{ animationDuration: '30s' }} />

        {/* 中心标志 - 虚空料子效果 */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-luxury-purple/20 via-luxury-cyan/10 to-luxury-gold/20 border border-luxury-purple/30 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.2)]">
          <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-br from-luxury-purple/10 to-transparent" />
          <Swords className="w-12 h-12 text-luxury-purple/40" />
        </div>

        {/* 装饰线条 - 增强发光 */}
        {[0, 45, 90, 135].map(angle => (
          <div
            key={angle}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-luxury-purple/20 to-transparent"
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
        const isDead = participant && participant.balance <= 0;
        const isMyAgent = participant?.isPlayer;
        const isJustSeated = phase === 'selecting' && isSelected && participant;
        const isDefending = participant && defendingAgents.has(participant.id);

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
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
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
                <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${isJustSeated ? 'scale-125' : 'scale-100'}`}>
                  <PixelAgent
                    key={`${participant.id}-${participant.balance}`}
                    agent={participant}
                    size={60}
                    showBalance={true}
                    isAttacking={isAttacking}
                    isHurt={isHurt}
                    isDefending={isDefending}
                  />
                </div>
              ) : (
                <span className="text-white/20 text-xl font-mono">{index + 1}</span>
              )}

              {/* 死亡标记 */}
              {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-void/60 z-20">
                  <span className="text-2xl">💀</span>
                </div>
              )}

              {/* 我的 Agent 标记 */}
              {isMyAgent && !isDead && (
                <div className="absolute top-0 right-0 w-4 h-4 bg-luxury-cyan rounded-bl-lg flex items-center justify-center z-20">
                  <span className="text-[8px] font-bold text-void">我</span>
                </div>
              )}
            </div>
            
            {/* Agent 名称 */}
            {participant && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-30">
                <span 
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border backdrop-blur-sm ${
                    isMyAgent 
                      ? 'bg-luxury-cyan/10 border-luxury-cyan/30 text-luxury-cyan' 
                      : 'bg-black/40 border-white/10 text-white/80'
                  }`}
                  style={{ 
                    color: isDead ? '#666' : (isMyAgent ? '#22d3ee' : participant.color),
                  }}
                >
                  {participant.name.slice(0, 8)}
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

      {/* 余额变化效果 - 精致简洁 */}
      {balanceChanges.map(b => (
        <div
          key={b.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: 'balance-float 1.2s ease-out forwards',
          }}
        >
          <div className={`px-2 py-0.5 rounded-md text-xs font-medium font-mono ${
            b.isGain
              ? 'text-luxury-green'
              : 'text-luxury-rose'
          }`}
          style={{
            textShadow: b.isGain
              ? '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)'
              : '0 0 8px rgba(244, 63, 94, 0.6), 0 0 16px rgba(244, 63, 94, 0.3)',
          }}>
            {b.isGain ? '+' : '-'}{b.amount} $MON
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
      
      {/* 进度条加载 - 只在 loading 阶段显示 */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm z-40">
          <div className="text-center w-80">
            <div className="text-xl font-bold text-luxury-gold font-display mb-6">
              进入战场
            </div>
            {/* 进度条容器 */}
            <div className="w-full h-3 bg-void-panel rounded-full overflow-hidden border border-luxury-gold/30">
              <div
                className="h-full bg-gradient-to-r from-luxury-gold via-luxury-amber to-luxury-gold transition-all duration-100 ease-out"
                style={{
                  width: `${countdown}%`,
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                }}
              />
            </div>
            {/* 进度百分比 */}
            <div className="text-sm text-white/60 mt-3 font-mono">
              {countdown}%
            </div>
          </div>
        </div>
      )}
      
      {/* 选择参赛者提示 */}
      {phase === 'selecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/60 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-4 h-4 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="text-3xl font-bold text-luxury-gold font-display">
              正在选择参赛者
            </div>
            <div className="text-base text-white/40 mt-3">
              随机抽取 10 名选手
            </div>
          </div>
        </div>
      )}
      
      {/* 等待状态 */}
      {phase === 'waiting' && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-void-panel/80 border border-luxury-purple/20 flex items-center justify-center mx-auto mb-3">
              <div className="w-3 h-3 bg-luxury-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-luxury-cyan rounded-full animate-bounce mx-2" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-base text-white/60 font-medium">Waiting for next round</p>
          </div>
        </div>
      )}
      
      {/* 战斗中状态指示器 */}
      {phase === 'fighting' && (
        <>
          {/* 战斗倒计时 */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-luxury-cyan/10 border border-luxury-cyan/30 rounded-lg z-20">
            <Timer className="w-3.5 h-3.5 text-luxury-cyan animate-pulse" />
            <span className="text-sm font-bold text-luxury-cyan font-mono">{countdown}s</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ArenaCanvas;
