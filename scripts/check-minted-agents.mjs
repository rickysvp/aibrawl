#!/usr/bin/env node
/**
 * 检查已铸造的 Agents 数据完整性
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

async function checkMintedAgents() {
  console.log('🔍 检查已铸造的 Agents...\n');

  // 获取所有用户 Agents
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_player', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }

  console.log(`📊 找到 ${agents.length} 个用户 Agents\n`);

  // 检查 public/nfts 目录下的图片
  const nftsDir = path.join(__dirname, '..', 'public', 'nfts');
  let nftFiles = [];
  try {
    nftFiles = fs.readdirSync(nftsDir).filter(f => f.endsWith('.png'));
    console.log(`🖼️  NFT 图片数量: ${nftFiles.length}`);
    console.log(`   示例: ${nftFiles.slice(0, 5).join(', ')}...\n`);
  } catch (err) {
    console.log(`⚠️ 无法读取 NFT 目录: ${err.message}\n`);
  }

  // 检查每个 Agent 的数据完整性
  agents.forEach((agent, i) => {
    console.log(`${i + 1}. ${agent.name}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   NFT ID: ${agent.nft_id}`);
    console.log(`   Image: ${agent.image || '❌ 缺失'}`);
    console.log(`   Color: ${agent.color || '❌ 缺失'}`);
    
    // 检查属性
    const stats = ['attack', 'defense', 'speed', 'crit_rate', 'crit_damage', 'evasion', 'accuracy', 'luck'];
    const missingStats = stats.filter(s => agent[s] === null || agent[s] === undefined);
    if (missingStats.length > 0) {
      console.log(`   ⚠️ 缺失属性: ${missingStats.join(', ')}`);
    } else {
      console.log(`   ✅ 所有属性完整`);
    }

    // 检查图片是否存在
    if (agent.image) {
      const imagePath = path.join(nftsDir, path.basename(agent.image));
      const exists = fs.existsSync(imagePath);
      console.log(`   图片存在: ${exists ? '✅' : '❌'}`);
    }

    console.log('');
  });

  // 显示数据库表结构
  console.log('\n📋 建议检查:');
  console.log('   1. agents 表的 image 字段是否正确存储');
  console.log('   2. public/nfts 目录是否有对应的图片文件');
  console.log('   3. 所有属性字段是否都有值');
}

checkMintedAgents();
