// 创建测试用户的脚本
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('创建测试用户...');
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username: 'testuser1' }
    });
    
    if (existingUser) {
      console.log('用户 testuser1 已存在');
      console.log('用户信息:', {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        displayName: existingUser.displayName
      });
      return;
    }
    
    // 创建密码哈希
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: 'testuser1',
        email: 'testuser1@example.com',
        displayName: 'Test User 1',
        password: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
        gender: 'MALE'
      }
    });
    
    console.log('✅ 测试用户创建成功:');
    console.log('- 用户名: testuser1');
    console.log('- 密码: password123');
    console.log('- 邮箱: testuser1@example.com');
    console.log('- 用户ID:', user.id);
    
    // 创建第二个用户用于情侣关系
    const existingUser2 = await prisma.user.findUnique({
      where: { username: 'testuser2' }
    });
    
    if (!existingUser2) {
      const hashedPassword2 = await bcrypt.hash('password123', 12);
      
      const user2 = await prisma.user.create({
        data: {
          username: 'testuser2',
          email: 'testuser2@example.com',
          displayName: 'Test User 2',
          password: hashedPassword2,
          role: 'USER',
          status: 'ACTIVE',
          gender: 'FEMALE'
        }
      });
      
      console.log('✅ 第二个测试用户创建成功:');
      console.log('- 用户名: testuser2');
      console.log('- 密码: password123');
      console.log('- 邮箱: testuser2@example.com');
      console.log('- 用户ID:', user2.id);
      
      // 创建情侣关系
      const couple = await prisma.couple.create({
        data: {
          person1Id: user.id,
          person1Name: user.displayName,
          person2Id: user2.id,
          person2Name: user2.displayName,
          isComplete: true,
          inviteCode: 'TEST123'
        }
      });
      
      // 更新用户的情侣ID
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: { coupleId: couple.id }
        }),
        prisma.user.update({
          where: { id: user2.id },
          data: { coupleId: couple.id }
        })
      ]);
      
      console.log('✅ 情侣关系创建成功:');
      console.log('- 情侣ID:', couple.id);
      console.log('- 邀请码:', couple.inviteCode);
    }
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();