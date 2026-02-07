#!/usr/bin/env node
/**
 * 测试铸造 Agent 功能
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

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testMint() {
  console.log('🧪 测试铸造 Agent...\n');

  // 模拟 Agent 数据
  const testAgent = {
    id: generateUUID(),
    name: 'TestUser-CYBER-X',
    nft_id: 99999,
    color: '#FF6B6B',
    image: '/nfts/nft1.png',
    attack: 50,
    defense: 50,
    speed: 50,
    crit_rate: 50,
    crit_damage: 50,
    evasion: 50,
    accuracy: 50,
    luck: 50,
    hp: 100,
    max_hp: 100,
    balance: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    total_battles: 0,
    win_rate: 0,
    total_earnings: 0,
    total_losses: 0,
    net_profit: 0,
    avg_damage_dealt: 0,
    avg_damage_taken: 0,
    max_kill_streak: 0,
    current_kill_streak: 0,
    tournament_wins: 0,
    tournament_top3: 0,
    status: 'idle',
    is_player: true,
    owner_id: generateUUID(),
  };

  console.log('📤 发送数据到 Supabase:');
  console.log(JSON.stringify(testAgent, null, 2));

  try {
    const { data, error } = await supabase
      .from('agents')
      .insert(testAgent)
      .select();

    if (error) {
      console.error('\n❌ 错误:', error.message);
      console.error('错误代码:', error.code);
      console.error('错误详情:', error.details);
    } else {
      console.log('\n✅ 成功!');
      console.log('返回数据:', data);
    }
  } catch (err) {
    console.error('\n❌ 异常:', err.message);
  }

  // 清理测试数据
  console.log('\n🧹 清理测试数据...');
  await supabase.from('agents').delete().eq('id', testAgent.id);
}

testMint();
