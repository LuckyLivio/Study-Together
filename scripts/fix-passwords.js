const { PrismaClient } = require('../src/generated/prisma/index.js');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('开始修复未加密的密码...');
    
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        password: true
      }
    });
    
    console.log(`找到 ${users.length} 个用户`);
    
    let fixedCount = 0;
    
    for (const user of users) {
      // 检查密码是否已经是bcrypt哈希（bcrypt哈希通常以$2a$、$2b$或$2y$开头）
      if (!user.password.startsWith('$2')) {
        console.log(`修复用户 ${user.username} 的密码...`);
        
        // 对明文密码进行哈希
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        // 更新数据库中的密码
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        
        fixedCount++;
        console.log(`✓ 用户 ${user.username} 的密码已修复`);
      } else {
        console.log(`用户 ${user.username} 的密码已经是加密的，跳过`);
      }
    }
    
    console.log(`\n修复完成！共修复了 ${fixedCount} 个用户的密码`);
    
    if (fixedCount > 0) {
      console.log('\n重要提示：');
      console.log('- 所有密码现在都已加密存储');
      console.log('- 用户需要使用原始密码登录');
      console.log('- 如果用户忘记密码，请使用密码重置功能');
    }
    
  } catch (error) {
    console.error('修复密码时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
fixPasswords()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });