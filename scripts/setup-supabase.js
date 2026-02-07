#!/usr/bin/env node
/**
 * Supabase 数据库初始化脚本
 * 使用 Service Role Key 执行建表和初始数据生成
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 配置
const SUPABASE_URL = 'https://mpnpwdfvvktnhwywumbh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 请设置 SUPABASE_SERVICE_KEY 环境变量');
  console.error('获取方式: Supabase Dashboard → Project Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupDatabase() {
  console.log('🚀 开始初始化 Supabase 数据库...\n');

  try {
    // 读取 schema.sql 文件
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 读取 schema.sql 文件...');

    // 分割 SQL 语句（按分号分割，但保留函数定义）
    const statements = schemaSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔧 需要执行 ${statements.length} 个 SQL 语句\n`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const firstLine = stmt.split('\n')[0].substring(0, 50);
      process.stdout.write(`[${i + 1}/${statements.length}] ${firstLine}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error) {
          // 如果 exec_sql 函数不存在，尝试直接执行
          console.log('⚠️ 跳过 (可能需要手动执行)');
        } else {
          console.log('✅');
        }
      } catch (err) {
        console.log('⚠️ 跳过');
      }
    }

    console.log('\n📊 检查 agents 表...');
    const { data: count, error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️ 无法查询 agents 表，可能需要手动执行 schema.sql');
    } else {
      console.log(`✅ agents 表已存在`);
    }

    console.log('\n🎉 初始化完成！');
    console.log('\n下一步：');
    console.log('1. 在 Supabase Dashboard 的 SQL Editor 中执行 supabase/schema.sql');
    console.log('2. 然后执行: SELECT generate_system_agents(1000);');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

setupDatabase();
