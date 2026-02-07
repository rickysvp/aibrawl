#!/usr/bin/env node
/**
 * 检查数据库表结构和缺失字段
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

async function checkDbSchema() {
  console.log('🔍 检查数据库表结构...\n');

  // 获取 agents 表的所有列
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'agents' });

  if (error) {
    console.log('ℹ️ 无法获取列信息（需要创建函数），直接查询数据检查...\n');
  }

  // 获取最新的用户 Agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('is_player', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (agentError) {
    console.error('❌ 查询失败:', agentError.message);
    return;
  }

  if (!agent) {
    console.log('⚠️ 没有找到用户 Agents');
    return;
  }

  console.log('📋 最新的 Agent 数据:\n');
  console.log(`名称: ${agent.name}`);
  console.log(`ID: ${agent.id}`);
  console.log(`NFT ID: ${agent.nft_id}`);
  console.log(`Image: ${agent.image || '❌ 缺失'}`);
  console.log(`Color: ${agent.color || '❌ 缺失'}`);
  console.log(`Owner: ${agent.owner_id || '❌ 缺失'}`);
  console.log(`Status: ${agent.status}`);
  console.log(`Is Player: ${agent.is_player}`);
  console.log(`Created At: ${agent.created_at || '❌ 缺失'}`);
  console.log(`Updated At: ${agent.updated_at || '❌ 缺失'}`);
  console.log('');

  // 检查所有字段
  const requiredFields = [
    'id', 'owner_id', 'name', 'nft_id', 'color', 'image',
    'attack', 'defense', 'speed', 'crit_rate', 'crit_damage',
    'evasion', 'accuracy', 'luck', 'hp', 'max_hp', 'balance',
    'wins', 'losses', 'kills', 'deaths', 'total_battles',
    'win_rate', 'total_earnings', 'total_losses', 'net_profit',
    'avg_damage_dealt', 'avg_damage_taken', 'max_kill_streak',
    'current_kill_streak', 'tournament_wins', 'tournament_top3',
    'status', 'is_player', 'created_at', 'updated_at'
  ];

  console.log('📊 字段完整性检查:');
  const missingFields = [];
  const nullFields = [];

  requiredFields.forEach(field => {
    if (!(field in agent)) {
      missingFields.push(field);
      console.log(`   ❌ ${field}: 字段不存在`);
    } else if (agent[field] === null || agent[field] === undefined) {
      nullFields.push(field);
      console.log(`   ⚠️  ${field}: null/undefined`);
    } else {
      const value = typeof agent[field] === 'string' && agent[field].length > 30
        ? agent[field].slice(0, 30) + '...'
        : agent[field];
      console.log(`   ✅ ${field}: ${value}`);
    }
  });

  console.log('');
  console.log('📈 统计:');
  console.log(`   总字段数: ${requiredFields.length}`);
  console.log(`   缺失字段: ${missingFields.length}`);
  console.log(`   Null字段: ${nullFields.length}`);

  if (missingFields.length > 0) {
    console.log(`\n❌ 缺失字段列表: ${missingFields.join(', ')}`);
  }
  if (nullFields.length > 0) {
    console.log(`\n⚠️  Null字段列表: ${nullFields.join(', ')}`);
  }
}

checkDbSchema();
