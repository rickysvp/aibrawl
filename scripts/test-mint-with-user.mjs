#!/usr/bin/env node
/**
 * 测试铸造流程，检查用户ID问题
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
  console.log('🧪 测试铸造流程...\n');

  const username = 'testuser_' + Date.now();
  const userId = generateUUID();

  console.log('1️⃣ 创建测试用户...');
  console.log('   Username:', username);
  console.log('   User ID:', userId);

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: username,
        wallet_address: '0x' + generateUUID().replace(/-/g, ''),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        balance: 10000,
        total_profit: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error('   ❌ 创建用户失败:', userError.message);
      console.error('   错误代码:', userError.code);
      return;
    }
    console.log('   ✅ 用户创建成功:', user.id);
  } catch (err) {
    console.error('   ❌ 异常:', err.message);
    return;
  }

  // 2. 铸造 Agent
  console.log('\n2️⃣ 铸造 Agent...');
  const agentId = generateUUID();

  try {
    const agentData = {
      id: agentId,
      owner_id: userId, // 使用我们创建的用户ID
      name: 'Test-Agent-X',
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
      rarity: 'common',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('   Agent ID:', agentId);
    console.log('   Owner ID:', userId);

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (agentError) {
      console.error('   ❌ 铸造 Agent 失败:', agentError.message);
      console.error('   错误代码:', agentError.code);
      console.error('   错误详情:', agentError.details);
      return;
    }
    console.log('   ✅ Agent 铸造成功:', agent.id);
  } catch (err) {
    console.error('   ❌ 异常:', err.message);
    return;
  }

  console.log('\n✅ 测试成功！');

  // 清理
  console.log('\n🧹 清理测试数据...');
  await supabase.from('agents').delete().eq('id', agentId);
  await supabase.from('users').delete().eq('id', userId);
  console.log('   ✅ 清理完成');
}

testMint();
