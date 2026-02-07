#!/usr/bin/env node
/**
 * 更新系统 Agents 的余额和属性
 * - 每个 Agent 分配 10000 MON
 * - 根据铸造规则随机分配属性 (11-99)
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

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 错误: 未找到 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 铸造规则：随机分配属性 (11-99)
function generateRandomAttributes() {
  return {
    attack: Math.floor(Math.random() * 89) + 11,      // 11-99
    defense: Math.floor(Math.random() * 89) + 11,     // 11-99
    speed: Math.floor(Math.random() * 89) + 11,       // 11-99
    crit_rate: Math.floor(Math.random() * 89) + 11,   // 11-99
    crit_damage: Math.floor(Math.random() * 89) + 11, // 11-99
    evasion: Math.floor(Math.random() * 89) + 11,     // 11-99
    accuracy: Math.floor(Math.random() * 89) + 11,    // 11-99
    luck: Math.floor(Math.random() * 89) + 11,        // 11-99
  };
}

async function updateAgents() {
  console.log('🚀 开始更新系统 Agents...\n');

  // 1. 获取所有系统 Agents
  console.log('1️⃣ 获取系统 Agents...');
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, balance, attack, defense, speed, crit_rate, crit_damage, evasion, accuracy, luck')
    .eq('is_player', false);

  if (error) {
    console.error('❌ 获取 Agents 失败:', error.message);
    return;
  }

  console.log(`   ✅ 找到 ${agents.length} 个系统 Agents`);

  // 2. 检查当前状态
  const withBalance = agents.filter(a => a.balance === 10000).length;
  const withAttributes = agents.filter(a => a.attack >= 11 && a.attack <= 99).length;

  console.log(`   💰 已有 10000 MON: ${withBalance}`);
  console.log(`   ⚔️  已分配属性: ${withAttributes}`);

  // 3. 批量更新 Agents
  console.log('\n2️⃣ 更新 Agents...');

  const batchSize = 100;
  const totalBatches = Math.ceil(agents.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batch = agents.slice(i * batchSize, (i + 1) * batchSize);
    
    const updates = batch.map(agent => ({
      id: agent.id,
      balance: 10000,
      ...generateRandomAttributes(),
      updated_at: new Date().toISOString(),
    }));

    const { error: updateError } = await supabase
      .from('agents')
      .upsert(updates);

    if (updateError) {
      console.error(`   ❌ 批次 ${i + 1}/${totalBatches} 失败:`, updateError.message);
    } else {
      console.log(`   ✅ 批次 ${i + 1}/${totalBatches} 完成 (${updates.length} 个 Agents)`);
    }

    // 小延迟避免 rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 4. 验证更新结果
  console.log('\n3️⃣ 验证更新结果...');
  const { data: updatedAgents, error: verifyError } = await supabase
    .from('agents')
    .select('balance, attack, defense, speed')
    .eq('is_player', false);

  if (verifyError) {
    console.error('❌ 验证失败:', verifyError.message);
    return;
  }

  const allHaveBalance = updatedAgents.every(a => a.balance === 10000);
  const allHaveAttributes = updatedAgents.every(a => a.attack >= 11 && a.attack <= 99);

  console.log(`   💰 所有 Agents 都有 10000 MON: ${allHaveBalance ? '✅' : '❌'}`);
  console.log(`   ⚔️  所有 Agents 都有属性: ${allHaveAttributes ? '✅' : '❌'}`);

  // 显示统计
  const avgAttack = updatedAgents.reduce((sum, a) => sum + a.attack, 0) / updatedAgents.length;
  const avgDefense = updatedAgents.reduce((sum, a) => sum + a.defense, 0) / updatedAgents.length;
  const avgSpeed = updatedAgents.reduce((sum, a) => sum + a.speed, 0) / updatedAgents.length;

  console.log('\n📊 属性统计:');
  console.log(`   平均 Attack: ${avgAttack.toFixed(2)}`);
  console.log(`   平均 Defense: ${avgDefense.toFixed(2)}`);
  console.log(`   平均 Speed: ${avgSpeed.toFixed(2)}`);

  console.log('\n✨ 更新完成！');
}

updateAgents();
