#!/usr/bin/env node

/**
 * AIrena 版本管理脚本
 * 用法:
 *   node scripts/version.js patch  - 更新补丁版本 (1.0.0 -> 1.0.1)
 *   node scripts/version.js minor  - 更新次要版本 (1.0.0 -> 1.1.0)
 *   node scripts/version.js major  - 更新主要版本 (1.0.0 -> 2.0.0)
 *   node scripts/version.js 1.2.3  - 设置指定版本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFile = path.join(__dirname, '..', 'version.json');
const packageFile = path.join(__dirname, '..', 'package.json');

function readPackageVersion() {
  const data = fs.readFileSync(packageFile, 'utf8');
  const packageData = JSON.parse(data);
  return packageData.version;
}

function writeVersion(version) {
  // 更新 package.json
  const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  packageData.version = version;
  fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');
  
  // 同步更新 version.json（如果存在）
  if (fs.existsSync(versionFile)) {
    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
    versionData.version = version;
    versionData.releaseDate = new Date().toISOString().split('T')[0];
    
    // 添加变更日志条目
    const changelogEntry = {
      version: version,
      date: versionData.releaseDate,
      changes: ['版本更新']
    };
    
    if (!versionData.changelog) {
      versionData.changelog = [];
    }
    versionData.changelog.unshift(changelogEntry);
    
    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
  }
}

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      throw new Error(`Unknown version type: ${type}`);
  }
  
  return parts.join('.');
}

function validateVersion(version) {
  const regex = /^\d+\.\d+\.\d+$/;
  return regex.test(version);
}

function main() {
  const args = process.argv.slice(2);
  const currentVersion = readPackageVersion();
  
  if (args.length === 0) {
    console.log(`\n🎮 AIrena 当前版本: v${currentVersion}\n`);
    console.log('用法:');
    console.log('  node scripts/version.js patch  - 更新补丁版本');
    console.log('  node scripts/version.js minor  - 更新次要版本');
    console.log('  node scripts/version.js major  - 更新主要版本');
    console.log('  node scripts/version.js 1.2.3  - 设置指定版本\n');
    return;
  }
  
  const arg = args[0];
  let newVersion;
  
  if (['patch', 'minor', 'major'].includes(arg)) {
    newVersion = bumpVersion(currentVersion, arg);
  } else if (validateVersion(arg)) {
    newVersion = arg;
  } else {
    console.error(`❌ 无效的版本号: ${arg}`);
    console.error('版本号格式应为: x.y.z (例如: 1.0.0)');
    process.exit(1);
  }
  
  // 写入文件
  writeVersion(newVersion);
  
  console.log(`\n✅ 版本已更新: v${currentVersion} -> v${newVersion}\n`);
  console.log('下一步操作:');
  console.log('  1. git add .');
  console.log(`  2. git commit -m "Release v${newVersion}"`);
  console.log(`  3. git tag v${newVersion}`);
  console.log('  4. git push origin main --tags\n');
}

main();
