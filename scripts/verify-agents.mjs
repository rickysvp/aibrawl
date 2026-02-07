#!/usr/bin/env node
/**
 * 验证 Agents 数据
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

async function verifyAgents() {
  console.log('🔍 验证 Agents 数据\n');

  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_player', false)
    .limit(10);

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  console.log(`📊 显示前 ${agents.length} 个系统 Agents:\n`);

  agents.forEach((agent, i) => {
    console.log(`${i + 1}. ${agent.name}`);
    console.log(`   💰 Balance: ${agent.balance} MON`);
    console.log(`   ⚔️  Attack: ${agent.attack}`);
    console.log(`   🛡️  Defense: ${agent.defense}`);
    console.log(`   ⚡ Speed: ${agent.speed}`);
    console.log(`   🎯 Crit Rate: ${agent.crit_rate}`);
    console.log(`   💥 Crit Damage: ${agent.crit_damage}`);
    console.log(`   💨 Evasion: ${agent.evasion}`);
    console.log(`   🎯 Accuracy: ${agent.accuracy}`);
    console.log(`   🍀 Luck: ${agent.luck}`);
    console.log(`   ❤️  HP: ${agent.hp}/${agent.max_hp}`);
    console.log(`   📊 Status: ${agent.status}`);
    console.log('');
  });

  // 统计所有 agents
  const { data: allAgents, error: countError } = await supabase
    .from('agents')
    .select('balance, attack, defense, speed, crit_rate, crit_damage, evasion, accuracy, luck')
    .eq('is_player', false);

  if (countError) {
    console.error('❌ 统计失败:', countError.message);
    return;
  }

  console.log('\n📈 整体统计:');
  console.log(`   总 Agents: ${allAgents.length}`);
  console.log(`   平均 Balance: ${(allAgents.reduce((s, a) => s + a.balance, 0) / allAgents.length).toFixed(2)} MON`);
  console.log(`   平均 Attack: ${(allAgents.reduce((s, a) => s + a.attack, 0) / allAgents.length).toFixed(2)}`);
  console.log(`   平均 Defense: ${(allAgents.reduce((s, a) => s + a.defense, 0) / allAgents.length).toFixed(2)}`);
  console.log(`   平均 Speed: ${(allAgents.reduce((s, a) => s + a.speed, 0) / allAgents.length).toFixed(2)}`);
  console.log(`   Attack 范围: ${Math.min(...allAgents.map(a => a.attack))} - ${Math.max(...allAgents.map(a => a.attack))}`);
}

verifyAgents();
