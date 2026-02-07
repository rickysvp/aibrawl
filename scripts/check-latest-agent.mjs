#!/usr/bin/env node
/**
 * 检查最新铸造的 Agent 数据
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

async function checkLatestAgent() {
  console.log('🔍 检查最新铸造的 Agent...\n');

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

  console.log('📋 最新 Agent 数据:\n');
  console.log(`名称: ${agent.name}`);
  console.log(`ID: ${agent.id}`);
  console.log(`NFT ID: ${agent.nft_id}`);
  console.log(`Image: ${agent.image || '❌ 缺失'}`);
  console.log(`Color: ${agent.color || '❌ 缺失'}`);
  console.log(`Rarity: ${agent.rarity || '❌ 缺失'}`);
  console.log('');

  // 检查属性
  console.log('📊 属性检查:');
  const stats = {
    attack: agent.attack,
    defense: agent.defense,
    speed: agent.speed,
    crit_rate: agent.crit_rate,
    crit_damage: agent.crit_damage,
    evasion: agent.evasion,
    accuracy: agent.accuracy,
    luck: agent.luck,
  };

  Object.entries(stats).forEach(([key, value]) => {
    const status = value === null || value === undefined ? '❌' : '✅';
    console.log(`   ${status} ${key}: ${value}`);
  });

  const totalStats = Object.values(stats).reduce((a, b) => a + (b || 0), 0);
  console.log(`   总属性: ${totalStats}`);
  console.log('');

  // 检查图片文件
  if (agent.image) {
    const nftsDir = path.join(__dirname, '..', 'public', 'nfts');
    const imageName = path.basename(agent.image);
    const imagePath = path.join(nftsDir, imageName);
    
    console.log('🖼️ 图片检查:');
    console.log(`   路径: ${agent.image}`);
    console.log(`   文件名: ${imageName}`);
    console.log(`   完整路径: ${imagePath}`);
    console.log(`   存在: ${fs.existsSync(imagePath) ? '✅' : '❌'}`);
  }
}

checkLatestAgent();
