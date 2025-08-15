const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkUserCouple() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        coupleId: true
      }
    });
    
    console.log('所有用户及其情侣关联:');
    users.forEach(user => {
      console.log(`用户: ${user.username} (${user.displayName || 'null'}), 情侣ID: ${user.coupleId || 'null'}`);
    });
    
    // 检查有coupleId的用户
    const usersWithCouple = users.filter(user => user.coupleId);
    console.log(`\n有情侣关联的用户数量: ${usersWithCouple.length}`);
    
    if (usersWithCouple.length > 0) {
      console.log('\n详细情侣关联信息:');
      for (const user of usersWithCouple) {
        const couple = await prisma.couple.findUnique({
          where: { id: user.coupleId },
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
        
        console.log(`用户 ${user.username} 关联的情侣记录:`);
        console.log(`  情侣ID: ${couple?.id || 'null'}`);
        console.log(`  邀请码: ${couple?.inviteCode || 'null'}`);
        console.log(`  完成状态: ${couple?.isComplete || false}`);
        console.log(`  关联用户数: ${couple?.users.length || 0}`);
        console.log('---');
      }
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCouple();