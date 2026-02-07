#!/usr/bin/env node
/**
 * 调试前端显示问题
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^VITE_(\w+)=(.+)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

async function debugFrontend() {
  console.log('🔍 调试前端显示问题...\n');

  // 获取最新的用户 Agent
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_player', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  if (!agent) {
    console.log('⚠️ 没有找到用户 Agents');
    return;
  }

  console.log('📋 Agent 数据:\n');
  console.log(JSON.stringify(agent, null, 2));

  console.log('\n\n🔄 模拟前端转换:\n');
  
  // 模拟 toFrontendAgent 转换
  const frontendAgent = {
    id: agent.id,
    name: agent.name,
    nftId: agent.nft_id,
    color: agent.color,
    image: agent.image,
    attack: agent.attack,
    defense: agent.defense,
    speed: agent.speed,
    critRate: agent.crit_rate,
    critDamage: agent.crit_damage,
    evasion: agent.evasion,
    accuracy: agent.accuracy,
    luck: agent.luck,
    totalStats: agent.attack + agent.defense + agent.speed + agent.crit_rate + agent.crit_damage + agent.evasion + agent.accuracy + agent.luck,
    rarity: 'common',
    hp: agent.hp,
    maxHp: agent.max_hp,
    balance: agent.balance,
    wins: agent.wins,
    losses: agent.losses,
    kills: agent.kills,
    deaths: agent.deaths,
    totalBattles: agent.total_battles,
    winRate: agent.win_rate,
    totalEarnings: agent.total_earnings,
    totalLosses: agent.total_losses,
    netProfit: agent.net_profit,
    avgDamageDealt: agent.avg_damage_dealt,
    avgDamageTaken: agent.avg_damage_taken,
    maxKillStreak: agent.max_kill_streak,
    currentKillStreak: agent.current_kill_streak,
    tournamentWins: agent.tournament_wins,
    tournamentTop3: agent.tournament_top3,
    battleHistory: [],
    status: agent.status,
    isPlayer: agent.is_player,
    pixelStyle: 0,
    createdAt: new Date(agent.created_at).getTime(),
  };

  console.log(JSON.stringify(frontendAgent, null, 2));

  // 检查图片路径
  console.log('\n\n🖼️ 图片检查:\n');
  if (agent.image) {
    const nftsDir = path.join(__dirname, '..', 'public', 'nfts');
    const imagePath = path.join(nftsDir, path.basename(agent.image));
    const exists = fs.existsSync(imagePath);
    console.log(`图片路径: ${agent.image}`);
    console.log(`完整路径: ${imagePath}`);
    console.log(`文件存在: ${exists ? '✅' : '❌'}`);
    
    if (!exists) {
      console.log('\n⚠️ 图片文件不存在！可用的图片:');
      try {
        const files = fs.readdirSync(nftsDir).filter(f => f.endsWith('.png'));
        console.log(files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : ''));
      } catch (e) {
        console.log('无法读取目录');
      }
    }
  } else {
    console.log('❌ Agent 没有 image 字段');
  }
}

debugFrontend();
