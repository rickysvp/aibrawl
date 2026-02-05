import { Agent } from '../types';

// 随机名称生成
const prefixes = ['超级', '闪电', '暗影', '烈焰', '冰霜', '雷霆', '狂暴', '幻影', '钢铁', '黄金'];
const suffixes = ['战士', '猎手', '刺客', '法师', '守卫', '勇者', '骑士', '忍者', '枪手', '斗士'];

// Agent 颜色
const agentColors = [
  '#ef4444', // 红
  '#f97316', // 橙
  '#eab308', // 黄
  '#22c55e', // 绿
  '#22d3ee', // 青
  '#3b82f6', // 蓝
  '#a855f7', // 紫
  '#ec4899', // 粉
  '#f43f5e', // 玫红
  '#14b8a6', // 青绿
];

// 生成随机 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成随机名称
const generateName = () => {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = Math.floor(Math.random() * 100);
  return `${prefix}${suffix}#${number}`;
};

// 生成随机 Agent
export const generateRandomAgent = (isPlayer: boolean = false): Agent => {
  const baseHp = 100 + Math.floor(Math.random() * 50);
  return {
    id: generateId(),
    name: generateName(),
    color: agentColors[Math.floor(Math.random() * agentColors.length)],
    hp: baseHp,
    maxHp: baseHp,
    attack: 10 + Math.floor(Math.random() * 10),
    defense: 5 + Math.floor(Math.random() * 5),
    balance: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    earnings: 0,
    status: 'idle',
    isPlayer,
    pixelStyle: Math.floor(Math.random() * 8), // 8种像素风格变体
  };
};

// 生成系统 Agents（带初始余额）
export const generateSystemAgents = (count: number): Agent[] => {
  return Array.from({ length: count }, () => {
    const agent = generateRandomAgent(false);
    agent.balance = 50 + Math.floor(Math.random() * 200); // 50-250 余额
    agent.status = 'in_arena';
    agent.wins = Math.floor(Math.random() * 20);
    agent.losses = Math.floor(Math.random() * 15);
    agent.kills = Math.floor(Math.random() * 30);
    return agent;
  });
};

// 为 Agent 生成随机位置（在竞技场内）
export const generateArenaPosition = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
};

// 生成随机移动位置
export const generateRandomPosition = (centerX: number, centerY: number, maxRadius: number) => {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * maxRadius;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
};

// 生成锦标赛系统 Agents（带足够余额报名）
export const generateTournamentAgents = (count: number, startIndex: number = 0): Agent[] => {
  const tournamentPrefixes = ['冠军', '王者', '传说', '神话', '至尊', '无敌', '神话', '传奇', '史诗', '英雄'];
  const tournamentSuffixes = ['战神', '斗神', '武神', '剑圣', '刀皇', '枪神', '拳霸', '影王', '魔君', '帝尊'];

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const prefix = tournamentPrefixes[index % tournamentPrefixes.length];
    const suffix = tournamentSuffixes[Math.floor(index / tournamentPrefixes.length) % tournamentSuffixes.length];

    const agent: Agent = {
      id: `tournament-${index}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${prefix}${suffix}#${index + 1}`,
      color: agentColors[index % agentColors.length],
      hp: 100 + Math.floor(Math.random() * 100),
      maxHp: 150 + Math.floor(Math.random() * 100),
      attack: 15 + Math.floor(Math.random() * 15),
      defense: 8 + Math.floor(Math.random() * 8),
      balance: 500 + Math.floor(Math.random() * 500), // 500-1000 余额，足够报名
      wins: Math.floor(Math.random() * 50),
      losses: Math.floor(Math.random() * 30),
      kills: Math.floor(Math.random() * 80),
      earnings: Math.floor(Math.random() * 5000),
      status: 'idle',
      isPlayer: false,
      pixelStyle: index % 8,
    };
    return agent;
  });
};

// 预生成1000个锦标赛系统Agents
export const TOURNAMENT_SYSTEM_AGENTS: Agent[] = generateTournamentAgents(1000);
