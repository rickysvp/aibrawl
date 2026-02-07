#!/usr/bin/env node
/**
 * 检查用户余额是否正确保存到数据库
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

async function checkUserBalance() {
  console.log('🔍 检查用户余额...\n');

  // 1. 检查 users 表结构
  console.log('1️⃣ 检查 users 表...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);

  if (usersError) {
    console.error('❌ 查询 users 表失败:', usersError.message);
  } else {
    console.log(`   ✅ users 表查询成功`);
    console.log(`   📊 用户数量: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n   📋 用户数据示例:');
      users.forEach((user, i) => {
        console.log(`      ${i + 1}. ${user.username || 'N/A'}`);
        console.log(`         ID: ${user.id}`);
        console.log(`         Balance: ${user.balance}`);
        console.log(`         Wallet: ${user.wallet_address?.slice(0, 10)}...`);
      });
    }
  }

  // 2. 检查 transactions 表
  console.log('\n2️⃣ 检查 transactions 表...');
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('*')
    .limit(5);

  if (transError) {
    console.error('❌ 查询 transactions 表失败:', transError.message);
    if (transError.code === '42P01') {
      console.log('   ⚠️ transactions 表不存在');
    }
  } else {
    console.log(`   ✅ transactions 表查询成功`);
    console.log(`   📊 交易记录数量: ${transactions.length}`);
  }

  // 3. 检查 agents 表
  console.log('\n3️⃣ 检查 agents 表...');
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name, owner_id, balance, is_player')
    .eq('is_player', true)
    .limit(5);

  if (agentsError) {
    console.error('❌ 查询 agents 表失败:', agentsError.message);
  } else {
    console.log(`   ✅ agents 表查询成功`);
    console.log(`   📊 用户 Agents 数量: ${agents.length}`);
    
    if (agents.length > 0) {
      console.log('\n   📋 用户 Agents 示例:');
      agents.forEach((agent, i) => {
        console.log(`      ${i + 1}. ${agent.name}`);
        console.log(`         Owner: ${agent.owner_id}`);
        console.log(`         Balance: ${agent.balance}`);
      });
    }
  }

  console.log('\n✨ 检查完成！');
}

checkUserBalance();
