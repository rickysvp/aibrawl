#!/usr/bin/env node
/**
 * 更新 Agents：将 HP 设置为与 Balance 相同（10000）
 * 规则：余额 MON 就是 HP
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

async function updateHpBalance() {
  console.log('🚀 更新 Agents HP = Balance...\n');

  // 1. 获取所有系统 Agents
  console.log('1️⃣ 获取系统 Agents...');
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, balance, hp, max_hp')
    .eq('is_player', false);

  if (error) {
    console.error('❌ 获取 Agents 失败:', error.message);
    return;
  }

  console.log(`   ✅ 找到 ${agents.length} 个系统 Agents`);

  // 2. 检查当前状态
  const correctHp = agents.filter(a => a.hp === a.balance).length;
  console.log(`   💰 HP = Balance: ${correctHp}/${agents.length}`);

  // 3. 批量更新 Agents
  console.log('\n2️⃣ 更新 HP = Balance...');

  const batchSize = 100;
  const totalBatches = Math.ceil(agents.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batch = agents.slice(i * batchSize, (i + 1) * batchSize);
    
    const updates = batch.map(agent => ({
      id: agent.id,
      hp: agent.balance,      // HP = 当前余额
      max_hp: 10000,          // 最大 HP = 初始余额
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

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 4. 验证更新结果
  console.log('\n3️⃣ 验证更新结果...');
  const { data: updatedAgents, error: verifyError } = await supabase
    .from('agents')
    .select('name, balance, hp, max_hp')
    .eq('is_player', false)
    .limit(5);

  if (verifyError) {
    console.error('❌ 验证失败:', verifyError.message);
    return;
  }

  console.log('\n📋 示例 Agents（HP = Balance）:');
  updatedAgents.forEach((agent, i) => {
    console.log(`${i + 1}. ${agent.name}`);
    console.log(`   💰 Balance: ${agent.balance} MON`);
    console.log(`   ❤️  HP: ${agent.hp}/${agent.max_hp}`);
    console.log('');
  });

  // 统计
  const { data: allAgents } = await supabase
    .from('agents')
    .select('balance, hp')
    .eq('is_player', false);

  const allMatch = allAgents.every(a => a.hp === a.balance);
  console.log(`✅ 所有 Agents HP = Balance: ${allMatch ? '是' : '否'}`);
  console.log(`📊 总 Agents: ${allAgents.length}`);

  console.log('\n✨ 更新完成！');
  console.log('💡 规则：余额 MON 就是 HP，攻击增加余额，被攻击减少余额');
}

updateHpBalance();
