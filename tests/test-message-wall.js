const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test data for message wall...');
    
    // 创建测试用户1
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.upsert({
      where: { email: 'test1@example.com' },
      update: {},
      create: {
        username: 'testuser1',
        email: 'test1@example.com',
        password: hashedPassword1,
        displayName: '小明',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
    
    // 创建测试用户2
    const hashedPassword2 = await bcrypt.hash('password123', 10);
    const user2 = await prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        username: 'testuser2',
        email: 'test2@example.com',
        password: hashedPassword2,
        displayName: '小红',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
    
    // 创建情侣关系
    const couple = await prisma.couple.upsert({
      where: { inviteCode: 'TEST123' },
      update: {
        person1Id: user1.id,
        person1Name: user1.displayName,
        person2Id: user2.id,
        person2Name: user2.displayName,
        isComplete: true
      },
      create: {
        name: '测试情侣',
        inviteCode: 'TEST123',
        person1Id: user1.id,
        person1Name: user1.displayName,
        person2Id: user2.id,
        person2Name: user2.displayName,
        isComplete: true
      }
    });
    
    // 更新用户的情侣关系
    await prisma.user.update({
      where: { id: user1.id },
      data: { coupleId: couple.id }
    });
    
    await prisma.user.update({
      where: { id: user2.id },
      data: { coupleId: couple.id }
    });
    
    // 创建一些测试留言
    await prisma.messageWallPost.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        content: '你好，这是我们的第一条留言！❤️',
        messageType: 'TEXT'
      }
    });
    
    await prisma.messageWallPost.create({
      data: {
        senderId: user2.id,
        receiverId: user1.id,
        content: '哇，留言墙功能真棒！我们可以在这里互相鼓励了 💕',
        messageType: 'TEXT'
      }
    });
    
    await prisma.messageWallPost.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        content: '加油学习！我们一起努力！',
        messageType: 'SURPRISE',
        surpriseType: 'heart_rain',
        surpriseData: JSON.stringify({ type: 'heart_rain' })
      }
    });
    
    console.log('Test data created successfully!');
    console.log('Test users:');
    console.log('User 1:', { email: 'test1@example.com', password: 'password123', name: '小明' });
    console.log('User 2:', { email: 'test2@example.com', password: 'password123', name: '小红' });
    console.log('Couple invite code:', 'TEST123');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();