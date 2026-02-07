#!/usr/bin/env node
/**
 * 检查前端数据加载问题
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

async function checkFrontendData() {
  console.log('🔍 检查前端数据加载...\n');

  // 获取最新的用户
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError.message);
    return;
  }

  if (!user) {
    console.log('⚠️ 没有找到用户');
    return;
  }

  console.log('👤 最新用户:');
  console.log(`   ID: ${user.id}`);
  console.log(`   昵称: ${user.username}`);
  console.log(`   余额: ${user.balance}`);
  console.log('');

  // 获取该用户的 Agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (agentsError) {
    console.error('❌ 查询 Agents 失败:', agentsError.message);
    return;
  }

  console.log(`🤖 用户 Agents (${agents.length}个):\n`);

  agents.forEach((agent, i) => {
    console.log(`${i + 1}. ${agent.name}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   Image: ${agent.image}`);
    console.log(`   Color: ${agent.color}`);
    console.log(`   Status: ${agent.status}`);
    
    // 检查前端需要的字段
    const frontendFields = {
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
      hp: agent.hp,
      maxHp: agent.max_hp,
      balance: agent.balance,
      status: agent.status,
      isPlayer: agent.is_player,
    };

    const missingFields = Object.entries(frontendFields)
      .filter(([_, v]) => v === null || v === undefined)
      .map(([k, _]) => k);

    if (missingFields.length > 0) {
      console.log(`   ❌ 缺失字段: ${missingFields.join(', ')}`);
    } else {
      console.log(`   ✅ 所有前端字段完整`);
    }
    console.log('');
  });

  console.log('💡 如果 Agents 显示空白，可能原因:');
  console.log('   1. AgentCard 组件渲染错误');
  console.log('   2. 图片路径不正确');
  console.log('   3. JavaScript 运行时错误');
  console.log('   4. 样式问题导致不可见');
}

checkFrontendData();
