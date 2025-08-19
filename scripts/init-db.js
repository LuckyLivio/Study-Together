#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于重置数据库并填充初始数据
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function log(message) {
  console.log(message);
}

function success(message) {
  colorLog('green', `✅ ${message}`);
}

function error(message) {
  colorLog('red', `❌ ${message}`);
}

function warning(message) {
  colorLog('yellow', `⚠️ ${message}`);
}

function info(message) {
  colorLog('blue', `ℹ️ ${message}`);
}

function title(message) {
  colorLog('cyan', `\n🚀 ${message}`);
  colorLog('cyan', '='.repeat(message.length + 4));
}

// 检查环境
function checkEnvironment() {
  title('检查环境');
  
  // 检查是否在项目根目录
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('请在项目根目录运行此脚本');
    process.exit(1);
  }
  
  // 检查 .env 文件
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    warning('.env 文件不存在，请确保数据库配置正确');
  }
  
  // 检查 prisma 目录
  const prismaPath = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaPath)) {
    error('prisma 目录不存在');
    process.exit(1);
  }
  
  success('环境检查通过');
}

// 执行命令
function runCommand(command, description) {
  try {
    info(`执行: ${description}`);
    log(`命令: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    success(`${description} 完成`);
  } catch (err) {
    error(`${description} 失败`);
    console.error(err.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force') || args.includes('-f'),
    skipMigration: args.includes('--skip-migration'),
    seedOnly: args.includes('--seed-only'),
    help: args.includes('--help') || args.includes('-h'),
  };

  if (options.help) {
    showHelp();
    return;
  }

  title('数据库初始化脚本');
  
  if (!options.force && !options.seedOnly) {
    warning('此操作将重置数据库并删除所有现有数据！');
    warning('如果确定要继续，请使用 --force 参数');
    warning('或者使用 --seed-only 仅运行种子数据');
    log('\n使用方法:');
    log('  npm run init-db -- --force        # 完全重置数据库');
    log('  npm run init-db -- --seed-only    # 仅运行种子数据');
    log('  npm run init-db -- --help         # 显示帮助');
    return;
  }

  checkEnvironment();

  try {
    if (!options.seedOnly) {
      // 1. 重置数据库
      title('重置数据库');
      if (!options.skipMigration) {
        runCommand('npx prisma migrate reset --force', '重置数据库迁移');
      }
      
      // 2. 生成 Prisma 客户端
      runCommand('npx prisma generate', '生成 Prisma 客户端');
    }

    // 3. 运行种子数据
    title('填充种子数据');
    runCommand('npx prisma db seed', '运行种子数据脚本');

    // 4. 完成
    title('初始化完成');
    success('数据库初始化成功！');
    log('\n🎯 默认账户信息:');
    log('管理员: admin / admin123');
    log('测试用户: alice / user123');
    log('测试用户: bob / user123');
    log('版主: moderator / mod123');
    log('\n🌐 访问地址: http://localhost:3000');
    
  } catch (err) {
    error('初始化过程中发生错误');
    console.error(err);
    process.exit(1);
  }
}

function showHelp() {
  title('数据库初始化脚本帮助');
  log('\n用法: npm run init-db [选项]');
  log('\n选项:');
  log('  --force, -f           强制重置数据库（删除所有数据）');
  log('  --seed-only          仅运行种子数据，不重置数据库');
  log('  --skip-migration     跳过数据库迁移（与 --force 一起使用）');
  log('  --help, -h           显示此帮助信息');
  log('\n示例:');
  log('  npm run init-db -- --force        # 完全重置数据库');
  log('  npm run init-db -- --seed-only    # 仅添加种子数据');
  log('  npm run init-db -- --help         # 显示帮助');
  log('\n注意:');
  log('  - 使用 --force 会删除所有现有数据');
  log('  - 确保在项目根目录运行此脚本');
  log('  - 确保 .env 文件配置正确');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main, checkEnvironment, runCommand };