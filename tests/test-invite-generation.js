const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testInviteGeneration() {
  try {
    console.log('开始测试邀请码生成功能...');
    
    // 查找一个测试用户
    const user = await prisma.user.findFirst({
      where: {
        email: { contains: 'test' }
      }
    });
    
    if (!user) {
      console.log('没有找到测试用户，创建一个...');
      const newUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          password: 'hashedpassword',
          gender: 'male'
        }
      });
      console.log('创建的测试用户:', newUser);
    } else {
      console.log('找到测试用户:', user);
    }
    
    // 检查是否已有情侣记录
    const existingCouple = await prisma.couple.findFirst({
      where: {
        OR: [
          { person1Id: user?.id || 'test' },
          { person2Id: user?.id || 'test' }
        ]
      }
    });
    
    if (existingCouple) {
      console.log('找到现有情侣记录:', existingCouple);
    } else {
      console.log('没有找到现有情侣记录');
    }
    
    // 生成邀请码
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    if (!existingCouple && user) {
      console.log('创建新的情侣记录...');
      const newCouple = await prisma.couple.create({
        data: {
          inviteCode: generateInviteCode(),
          person1Id: user.id,
          person1Name: user.displayName || user.username,
          person2Id: null,
          person2Name: null,
          isComplete: false
        }
      });
      console.log('创建的情侣记录:', newCouple);
    }
    
    // 查看所有情侣记录
    const allCouples = await prisma.couple.findMany();
    console.log('所有情侣记录:', allCouples);
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInviteGeneration();