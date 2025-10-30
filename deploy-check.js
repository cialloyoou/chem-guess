#!/usr/bin/env node

/**
 * 部署前检查脚本
 * Pre-deployment Check Script
 * 
 * 用途：检查项目是否准备好部署
 * Usage: node deploy-check.js
 */

const fs = require('fs');
const path = require('path');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}: ${filePath}`, 'green');
  } else {
    log(`❌ ${description} 不存在: ${filePath}`, 'red');
  }
  return exists;
}

function checkEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`⚠️  环境变量文件不存在: ${filePath}`, 'yellow');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  log(`✅ 环境变量文件存在: ${filePath}`, 'green');
  log(`   包含 ${lines.length} 个配置项`, 'cyan');
  
  // 检查关键配置
  const requiredVars = filePath.includes('server') 
    ? ['PORT', 'CLIENT_URL', 'SERVER_URL']
    : ['VITE_SERVER_URL'];
  
  const missingVars = [];
  requiredVars.forEach(varName => {
    if (!content.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log(`   ⚠️  缺少关键配置: ${missingVars.join(', ')}`, 'yellow');
    return false;
  }
  
  return true;
}

function checkPackageJson(dirPath, name) {
  const packagePath = path.join(dirPath, 'package.json');
  if (!fs.existsSync(packagePath)) {
    log(`❌ ${name} package.json 不存在`, 'red');
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  log(`✅ ${name} package.json 存在`, 'green');
  
  // 检查脚本
  const requiredScripts = name === '后端' 
    ? ['start']
    : ['build', 'dev'];
  
  const missingScripts = requiredScripts.filter(script => !pkg.scripts || !pkg.scripts[script]);
  if (missingScripts.length > 0) {
    log(`   ⚠️  缺少脚本: ${missingScripts.join(', ')}`, 'yellow');
    return false;
  }
  
  log(`   包含必要脚本: ${requiredScripts.join(', ')}`, 'cyan');
  return true;
}

function checkDependencies(dirPath, name) {
  const nodeModulesPath = path.join(dirPath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log(`⚠️  ${name} 依赖未安装，请运行: cd ${dirPath} && npm install`, 'yellow');
    return false;
  }
  
  log(`✅ ${name} 依赖已安装`, 'green');
  return true;
}

function checkQuestionBank() {
  const jsonPath = path.join(__dirname, 'server/data/chemistry_questions.json');
  const csvPath = path.join(__dirname, 'server/data/chemistry_questions_export.csv');
  const xlsxPath = path.join(__dirname, 'server/data/chemistry_questions_export.xlsx');
  
  let hasQuestions = false;
  
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    log(`✅ 题库 JSON 文件存在，包含 ${data.length} 道题`, 'green');
    hasQuestions = true;
  }
  
  if (fs.existsSync(csvPath)) {
    log(`✅ 题库 CSV 导出文件存在`, 'green');
  }
  
  if (fs.existsSync(xlsxPath)) {
    log(`✅ 题库 XLSX 导出文件存在`, 'green');
  }
  
  if (!hasQuestions) {
    log(`❌ 题库文件不存在，请确保至少有一个题库文件`, 'red');
  }
  
  return hasQuestions;
}

function generateDeploymentSummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 部署配置建议', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log('\n【后端部署】', 'blue');
  log('1. 选择部署平台: Railway / Render / 自建服务器');
  log('2. 配置环境变量（参考 server/.env.example）');
  log('3. 关键配置:');
  log('   - PORT=3000');
  log('   - CLIENT_URL=<前端域名>');
  log('   - SERVER_URL=<后端域名>');
  log('   - LEADERBOARD_STORAGE=file (小规模) 或 mongodb (大规模)');
  log('4. 如使用文件存储，需配置持久化卷（Volume）');
  
  log('\n【前端部署】', 'blue');
  log('1. 选择部署平台: Vercel / Netlify / Railway');
  log('2. 配置环境变量（参考 client/.env.example）');
  log('3. 关键配置:');
  log('   - VITE_SERVER_URL=<后端域名>');
  log('   - VITE_SOCKET_URL=<后端域名>');
  log('4. 构建命令: npm run build');
  log('5. 输出目录: dist');
  
  log('\n【在线题库配置】', 'blue');
  log('1. 在腾讯文档/Google Sheets 创建题库表格');
  log('2. 发布为 CSV 公开链接');
  log('3. 配置后端环境变量: CHEM_CSV_URL=<CSV链接>');
  log('4. 刷新题库: POST /api/admin/refresh-questions');
  
  log('\n【数据持久化】', 'blue');
  log('方案 A (文件存储):');
  log('  - 适合小规模部署（< 1000 用户）');
  log('  - 需配置持久化卷（Railway Volume / Render Disk）');
  log('  - LEADERBOARD_STORAGE=file');
  log('\n方案 B (MongoDB):');
  log('  - 适合大规模部署（> 1000 用户）');
  log('  - 使用 MongoDB Atlas 免费层');
  log('  - LEADERBOARD_STORAGE=mongodb');
  log('  - MONGODB_URI=<连接字符串>');
  
  log('\n' + '='.repeat(60), 'cyan');
}

// 主检查流程
async function main() {
  log('\n🚀 开始部署前检查...\n', 'cyan');
  
  let allPassed = true;
  
  // 1. 检查项目结构
  log('【1/6】检查项目结构', 'blue');
  allPassed &= checkFileExists('server/server.js', '后端入口文件');
  allPassed &= checkFileExists('client/index.html', '前端入口文件');
  allPassed &= checkFileExists('server/package.json', '后端配置文件');
  allPassed &= checkFileExists('client/package.json', '前端配置文件');
  
  // 2. 检查环境变量
  log('\n【2/6】检查环境变量配置', 'blue');
  checkEnvFile('server/.env.example');
  checkEnvFile('client/.env.example');
  
  const serverEnvExists = fs.existsSync('server/.env');
  const clientEnvExists = fs.existsSync('client/.env');
  
  if (!serverEnvExists) {
    log('⚠️  后端 .env 文件不存在，部署时需要配置环境变量', 'yellow');
  }
  if (!clientEnvExists) {
    log('⚠️  前端 .env 文件不存在，部署时需要配置环境变量', 'yellow');
  }
  
  // 3. 检查 package.json
  log('\n【3/6】检查 package.json 配置', 'blue');
  allPassed &= checkPackageJson('server', '后端');
  allPassed &= checkPackageJson('client', '前端');
  
  // 4. 检查依赖安装
  log('\n【4/6】检查依赖安装', 'blue');
  checkDependencies('server', '后端');
  checkDependencies('client', '前端');
  
  // 5. 检查题库
  log('\n【5/6】检查题库文件', 'blue');
  allPassed &= checkQuestionBank();
  
  // 6. 检查关键文件
  log('\n【6/6】检查关键功能文件', 'blue');
  checkFileExists('server/seed/chemistry_seed.js', '题库加载模块');
  checkFileExists('server/utils/leaderboard.js', '排行榜模块');
  checkFileExists('server/utils/socket.js', 'Socket.IO 模块');
  
  // 生成部署建议
  generateDeploymentSummary();
  
  // 最终结果
  log('\n' + '='.repeat(60), 'cyan');
  if (allPassed) {
    log('✅ 所有检查通过！项目已准备好部署', 'green');
    log('📖 详细部署步骤请参考: DEPLOYMENT.md', 'cyan');
  } else {
    log('⚠️  部分检查未通过，请修复后再部署', 'yellow');
    log('💡 提示: 大部分警告不影响部署，但建议修复', 'cyan');
  }
  log('='.repeat(60) + '\n', 'cyan');
}

main().catch(err => {
  log(`\n❌ 检查过程出错: ${err.message}`, 'red');
  process.exit(1);
});

