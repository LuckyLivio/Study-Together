const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkTestUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { username: 'testuser1' },
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });
    
    if (user) {
      console.log('testuser1 信息:');
      console.log('- 用户名:', user.username);
      console.log('- 显示名:', user.displayName);
      console.log('- 情侣ID:', user.coupleId);
      console.log('- 情侣状态:', user.couple ? (user.couple.isComplete ? '已完成' : '未完成') : '无情侣');
      
      if (user.couple) {
        console.log('- 邀请码:', user.couple.inviteCode);
        console.log('- 情侣成员:');
        user.couple.users.forEach((u, i) => {
          console.log(`  ${i + 1}. ${u.username} (${u.displayName})`);
        });
      }
      
      console.log('\n请在浏览器中访问 http://localhost:3000/login');
      console.log('使用以下凭据登录:');
      console.log('用户名: testuser1');
      console.log('密码: password123');
    } else {
      console.log('未找到 testuser1 用户');
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUser();