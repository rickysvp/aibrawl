#!/usr/bin/env node
/**
 * Supabase 连接测试脚本
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

// 解析环境变量
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
  console.error('请检查 .env 文件');
  process.exit(1);
}

console.log('🔌 连接到 Supabase...');
console.log(`URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('\n📋 开始测试...\n');

  // 测试 1: 基本连接
  console.log('1️⃣ 测试基本连接...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('   ✅ 连接成功');
  } catch (err) {
    console.log('   ❌ 连接失败:', err.message);
    return;
  }

  // 测试 2: 检查 agents 表
  console.log('\n2️⃣ 检查 agents 表...');
  try {
    const { data, error, count } = await supabase
      .from('agents')
      .select('*', { count: 'exact' });

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ agents 表不存在');
        console.log('   💡 请先执行 supabase/schema.sql');
      } else {
        console.log('   ❌ 查询失败:', error.message);
      }
    } else {
      console.log(`   ✅ agents 表存在`);
      console.log(`   📊 总记录数: ${count}`);

      // 检查系统 agents
      const { data: systemAgents, count: systemCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact' })
        .eq('is_player', false);

      console.log(`   🤖 系统 Agents: ${systemCount}`);

      // 检查用户 agents
      const { data: playerAgents, count: playerCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact' })
        .eq('is_player', true);

      console.log(`   👤 用户 Agents: ${playerCount}`);

      // 显示前 3 个系统 agent
      if (systemAgents && systemAgents.length > 0) {
        console.log('\n   📋 示例系统 Agents:');
        systemAgents.slice(0, 3).forEach((agent, i) => {
          console.log(`      ${i + 1}. ${agent.name} (ID: ${agent.id.slice(0, 8)}...)`);
        });
      }
    }
  } catch (err) {
    console.log('   ❌ 错误:', err.message);
  }

  // 测试 3: 检查其他表
  console.log('\n3️⃣ 检查其他表...');
  const tables = ['users', 'battles', 'battle_logs', 'transactions'];

  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ ${table}: 表不存在`);
        } else {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}: ${count || 0} 条记录`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }

  // 测试 4: RLS 策略检查
  console.log('\n4️⃣ 测试数据访问权限...');
  try {
    // 尝试插入一个测试 agent
    const { error } = await supabase
      .from('agents')
      .insert({
        name: 'Test-Agent',
        nft_id: 99999,
        color: '#FF0000',
        is_player: false,
        status: 'idle',
      })
      .select();

    if (error) {
      if (error.code === '42501') {
        console.log('   ⚠️  RLS 策略阻止插入（这是正常的，需要认证）');
      } else {
        console.log('   ⚠️  插入测试:', error.message);
      }
    } else {
      console.log('   ✅ 可以插入数据');

      // 清理测试数据
      await supabase.from('agents').delete().eq('nft_id', 99999);
      console.log('   🧹 已清理测试数据');
    }
  } catch (err) {
    console.log('   ❌ 错误:', err.message);
  }

  console.log('\n✨ 测试完成！');
}

testConnection();
