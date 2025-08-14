const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function cleanupTestUser() {
  try {
    console.log('开始清理 testuser 的情侣关系...');
    
    // 查找 testuser
    const user = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });
    
    if (!user) {
      console.log('未找到 testuser');
      return;
    }
    
    console.log(`找到用户: ${user.username} (ID: ${user.id})`);
    
    // 查找用户的情侣关系
    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { person1Id: user.id },
          { person2Id: user.id }
        ]
      }
    });
    
    if (couple) {
      console.log(`找到情侣关系: ${couple.id}`);
      
      // 删除情侣关系
      await prisma.couple.delete({
        where: { id: couple.id }
      });
      
      console.log('✓ 情侣关系已删除');
    } else {
      console.log('用户没有情侣关系');
    }
    
    // 清理用户的情侣ID
    await prisma.user.update({
      where: { id: user.id },
      data: { coupleId: null }
    });
    
    console.log('✓ 用户的情侣ID已清理');
    
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUser();