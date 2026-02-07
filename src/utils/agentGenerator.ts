import { Agent, BattleRecord, Rarity } from '../types';

// 英文代号前缀
const codePrefixes = ['CYBER', 'NEON', 'QUANTUM', 'PHANTOM', 'STEEL', 'SHADOW', 'FLAME', 'FROST', 'STORM', 'VIPER', 'RAPTOR', 'TITAN', 'NOVA', 'SOLAR', 'LUNAR', 'COSMIC', 'VOID', 'AETHER', 'ZENITH', 'NEXUS'];
// 英文代号后缀
const codeSuffixes = ['X', 'Z', 'V', 'S', 'R', 'K', 'N', 'M', 'P', 'T', '7', '9', '01', '02', '03', 'X1', 'Z9', 'V2', 'A1', 'ZERO'];

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

// 稀有度配置
const rarityConfig: Record<Rarity, { minStats: number; maxStats: number; name: string; color: string }> = {
  common: { minStats: 55, maxStats: 111, name: '普通', color: '#9ca3af' },
  rare: { minStats: 112, maxStats: 166, name: '稀有', color: '#3b82f6' },
  epic: { minStats: 167, maxStats: 222, name: '史诗', color: '#a855f7' },
  legendary: { minStats: 223, maxStats: 277, name: '传说', color: '#f59e0b' },
  mythic: { minStats: 278, maxStats: 332, name: '神话', color: '#ef4444' },
};

// NFT编号计数器
let nftIdCounter = 1000;

// 生成随机 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成NFT编号
const generateNftId = () => {
  return nftIdCounter++;
};

// NFT图片列表（从public/nfts目录）
const nftImages = Array.from({ length: 52 }, (_, i) => `/nfts/nft${i + 1}.png`);

// 生成随机NFT图片
const generateNftImage = () => {
  return nftImages[Math.floor(Math.random() * nftImages.length)];
};

// 生成英文代号名称
const generateName = (nftId: number) => {
  const prefix = codePrefixes[Math.floor(Math.random() * codePrefixes.length)];
  const suffix = codeSuffixes[Math.floor(Math.random() * codeSuffixes.length)];
  return `${prefix}-${suffix}`;
};

// 生成属性点 (11-99, 总和<333)
const generateStats = () => {
  // 先生成5个11-99之间的随机数
  const minStat = 11;
  const maxStat = 99;
  const maxTotal = 332;

  let attack = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));
  let defense = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));
  let crit = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));
  let hit = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));
  let agility = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));

  let total = attack + defense + crit + hit + agility;

  // 如果总和超过332，按比例缩减
  if (total > maxTotal) {
    const ratio = maxTotal / total;
    attack = Math.max(minStat, Math.floor(attack * ratio));
    defense = Math.max(minStat, Math.floor(defense * ratio));
    crit = Math.max(minStat, Math.floor(crit * ratio));
    hit = Math.max(minStat, Math.floor(hit * ratio));
    agility = Math.max(minStat, Math.floor(agility * ratio));
    total = attack + defense + crit + hit + agility;
  }

  // 计算稀有度
  let rarity: Rarity = 'common';
  for (const [key, config] of Object.entries(rarityConfig)) {
    if (total >= config.minStats && total <= config.maxStats) {
      rarity = key as Rarity;
      break;
    }
  }

  return { attack, defense, crit, hit, agility, totalStats: total, rarity };
};

// 生成战斗历史记录
const generateBattleHistory = (wins: number, losses: number): BattleRecord[] => {
  const history: BattleRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < wins + losses; i++) {
    const isWin = i < wins;
    history.push({
      id: `battle-${i}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 过去30天内
      opponent: `Opponent#${Math.floor(Math.random() * 1000)}`,
      result: isWin ? 'win' : 'loss',
      damageDealt: 50 + Math.floor(Math.random() * 100),
      damageTaken: isWin ? 20 + Math.floor(Math.random() * 50) : 80 + Math.floor(Math.random() * 50),
      earnings: isWin ? 50 + Math.floor(Math.random() * 150) : -30 - Math.floor(Math.random() * 50),
      kills: isWin ? 1 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2),
      isTournament: Math.random() > 0.7,
      tournamentName: Math.random() > 0.7 ? `Tournament #${Math.floor(Math.random() * 100)}` : undefined,
      rank: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : undefined,
    });
  }

  return history.sort((a, b) => b.timestamp - a.timestamp);
};

// 计算Agent统计数据
const calculateAgentStats = (wins: number, losses: number, _kills: number, history: BattleRecord[]) => {
  const totalBattles = wins + losses;
  const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;

  const totalEarnings = history.reduce((sum, h) => h.earnings > 0 ? sum + h.earnings : sum, 0);
  const totalLosses = history.reduce((sum, h) => h.earnings < 0 ? sum + Math.abs(h.earnings) : sum, 0);
  const netProfit = totalEarnings - totalLosses;

  const avgDamageDealt = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.damageDealt, 0) / history.length)
    : 0;
  const avgDamageTaken = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.damageTaken, 0) / history.length)
    : 0;

  // 计算最高连杀
  let maxKillStreak = 0;
  let currentStreak = 0;
  [...history].reverse().forEach(h => {
    if (h.result === 'win') {
      currentStreak++;
      maxKillStreak = Math.max(maxKillStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const tournamentWins = history.filter(h => h.isTournament && h.rank === 1).length;
  const tournamentTop3 = history.filter(h => h.isTournament && h.rank && h.rank <= 3).length;

  return {
    totalBattles,
    winRate,
    totalEarnings,
    totalLosses,
    netProfit,
    avgDamageDealt,
    avgDamageTaken,
    maxKillStreak,
    currentKillStreak: currentStreak,
    tournamentWins,
    tournamentTop3,
  };
};

// 生成随机 Agent
export const generateRandomAgent = (isPlayer: boolean = false, isNew: boolean = false): Agent => {
  const baseHp = 100 + Math.floor(Math.random() * 50);
  
  // 如果是新铸造的 Agent，初始数据为 0
  const wins = isNew ? 0 : Math.floor(Math.random() * 30);
  const losses = isNew ? 0 : Math.floor(Math.random() * 20);
  const kills = isNew ? 0 : Math.floor(Math.random() * 50);

  const battleHistory = isNew ? [] : generateBattleHistory(wins, losses);
  const stats = calculateAgentStats(wins, losses, kills, battleHistory);
  const agentStats = generateStats();
  const nftId = generateNftId();

  return {
    id: generateId(),
    name: generateName(nftId),
    nftId: nftId,
    color: agentColors[Math.floor(Math.random() * agentColors.length)],
    image: generateNftImage(),
    // 基础属性
    ...agentStats,
    // 战斗属性
    hp: baseHp,
    maxHp: baseHp,
    // 经济
    balance: 0,
    // 基础统计
    wins,
    losses,
    kills,
    deaths: losses,
    // 详细统计
    totalBattles: stats.totalBattles,
    winRate: stats.winRate,
    totalEarnings: stats.totalEarnings,
    totalLosses: stats.totalLosses,
    netProfit: stats.netProfit,
    avgDamageDealt: stats.avgDamageDealt,
    avgDamageTaken: stats.avgDamageTaken,
    maxKillStreak: stats.maxKillStreak,
    currentKillStreak: stats.currentKillStreak,
    tournamentWins: stats.tournamentWins,
    tournamentTop3: stats.tournamentTop3,
    // 历史记录
    battleHistory,
    // 状态
    status: 'idle',
    isPlayer,
    pixelStyle: Math.floor(Math.random() * 8),
    createdAt: Date.now(),
  };
};

// 生成系统 Agents（带初始余额和真实数据）
export const generateSystemAgents = (count: number): Agent[] => {
  return Array.from({ length: count }, () => {
    const agent = generateRandomAgent(false);
    agent.balance = 50 + Math.floor(Math.random() * 200); // 50-250 余额
    agent.status = 'in_arena';
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

// 生成锦标赛系统 Agents（带足够余额报名和真实数据）
export const generateTournamentAgents = (count: number, startIndex: number = 0): Agent[] => {
  const tournamentPrefixes = ['冠军', '王者', '传说', '神话', '至尊', '无敌', '神话', '传奇', '史诗', '英雄'];
  const tournamentSuffixes = ['战神', '斗神', '武神', '剑圣', '刀皇', '枪神', '拳霸', '影王', '魔君', '帝尊'];

  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const prefix = tournamentPrefixes[index % tournamentPrefixes.length];
    const suffix = tournamentSuffixes[Math.floor(index / tournamentPrefixes.length) % tournamentSuffixes.length];

    const wins = Math.floor(Math.random() * 50) + 20;
    const losses = Math.floor(Math.random() * 30) + 10;
    const kills = Math.floor(Math.random() * 80) + 30;

    const battleHistory = generateBattleHistory(wins, losses);
    const stats = calculateAgentStats(wins, losses, kills, battleHistory);

    const attack = 15 + Math.floor(Math.random() * 15);
    const defense = 8 + Math.floor(Math.random() * 8);
    const crit = 10 + Math.floor(Math.random() * 10);
    const hit = 12 + Math.floor(Math.random() * 12);
    const agility = 10 + Math.floor(Math.random() * 10);
    const totalStats = attack + defense + crit + hit + agility;
    
    const agent: Agent = {
      id: `tournament-${index}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${prefix}${suffix}#${index + 1}`,
      nftId: index + 1,
      color: agentColors[index % agentColors.length],
      image: generateNftImage(),
      hp: 100 + Math.floor(Math.random() * 100),
      maxHp: 150 + Math.floor(Math.random() * 100),
      attack,
      defense,
      crit,
      hit,
      agility,
      totalStats,
      rarity: ['common', 'rare', 'epic', 'legendary', 'mythic'][Math.floor(Math.random() * 5)] as Rarity,
      balance: 500 + Math.floor(Math.random() * 500), // 500-1000 余额，足够报名
      // 基础统计
      wins,
      losses,
      kills,
      deaths: losses,
      // 详细统计
      totalBattles: stats.totalBattles,
      winRate: stats.winRate,
      totalEarnings: stats.totalEarnings,
      totalLosses: stats.totalLosses,
      netProfit: stats.netProfit,
      avgDamageDealt: stats.avgDamageDealt,
      avgDamageTaken: stats.avgDamageTaken,
      maxKillStreak: stats.maxKillStreak,
      currentKillStreak: stats.currentKillStreak,
      tournamentWins: stats.tournamentWins,
      tournamentTop3: stats.tournamentTop3,
      // 历史记录
      battleHistory,
      // 状态
      status: 'idle',
      isPlayer: false,
      pixelStyle: index % 8,
      createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    };
    return agent;
  });
};

// 预生成1000个锦标赛系统Agents
export const TOURNAMENT_SYSTEM_AGENTS: Agent[] = generateTournamentAgents(1000);
