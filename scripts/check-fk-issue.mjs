#!/usr/bin/env node
/**
 * 检查外键约束问题
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

async function checkFKIssue() {
  console.log('🔍 检查外键约束问题...\n');

  // 1. 检查 users 表
  console.log('1️⃣ 检查 users 表...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (usersError) {
    console.error('❌ 查询 users 表失败:', usersError.message);
  } else {
    console.log(`   ✅ 找到 ${users.length} 个用户`);
    users.forEach((u, i) => {
      console.log(`      ${i + 1}. ${u.username} (${u.id.slice(0, 8)}...)`);
    });
  }

  // 2. 检查 agents 表的 owner_id
  console.log('\n2️⃣ 检查 agents 表的 owner_id...');
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name, owner_id, is_player')
    .eq('is_player', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (agentsError) {
    console.error('❌ 查询 agents 表失败:', agentsError.message);
  } else {
    console.log(`   ✅ 找到 ${agents.length} 个用户 Agents`);
    agents.forEach((a, i) => {
      console.log(`      ${i + 1}. ${a.name}`);
      console.log(`         Owner: ${a.owner_id.slice(0, 20)}...`);
      // 检查 owner_id 是否在 users 表中
      const ownerExists = users?.some(u => u.id === a.owner_id);
      console.log(`         Owner exists: ${ownerExists ? '✅' : '❌'}`);
    });
  }

  // 3. 检查外键约束
  console.log('\n3️⃣ 检查外键约束...');
  const { data: fkData, error: fkError } = await supabase
    .rpc('get_foreign_keys', { table_name: 'agents' });

  if (fkError) {
    console.log('   ℹ️ 无法获取外键信息（需要创建函数）');
  } else {
    console.log('   外键约束:', fkData);
  }

  // 4. 检查是否有孤立的 agents
  console.log('\n4️⃣ 检查孤立的 agents...');
  const { data: allAgents, error: allAgentsError } = await supabase
    .from('agents')
    .select('owner_id')
    .eq('is_player', true);

  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id');

  if (!allAgentsError && !allUsersError) {
    const userIds = new Set(allUsers?.map(u => u.id) || []);
    const orphanedAgents = allAgents?.filter(a => !userIds.has(a.owner_id)) || [];
    console.log(`   总 Agents: ${allAgents?.length || 0}`);
    console.log(`   孤立 Agents: ${orphanedAgents.length}`);
    if (orphanedAgents.length > 0) {
      console.log('   ⚠️ 发现孤立的 Agents，需要清理或修复');
    }
  }

  console.log('\n💡 建议:');
  console.log('   1. 确保铸造 Agent 时，owner_id 是 users 表中存在的 id');
  console.log('   2. 如果 users 表为空，需要先创建用户');
  console.log('   3. 检查 RLS 策略是否允许插入 agents');
}

checkFKIssue();
