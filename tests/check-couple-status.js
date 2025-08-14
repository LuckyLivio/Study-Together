const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkCoupleStatus() {
  try {
    const couples = await prisma.couple.findMany({
      include: {
        users: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });
    
    console.log('所有情侣记录:');
    couples.forEach(couple => {
      console.log(`ID: ${couple.id}, 邀请码: ${couple.inviteCode}, 完成状态: ${couple.isComplete}`);
      console.log(`  用户数量: ${couple.users.length}`);
      couple.users.forEach((user, index) => {
        console.log(`  用户${index + 1}: ${user.username} (${user.displayName || 'null'})`);
      });
      console.log('---');
    });
    
    if (couples.length === 0) {
      console.log('没有找到任何情侣记录');
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoupleStatus();