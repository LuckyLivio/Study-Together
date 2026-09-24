const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testMessageWallComplete() {
  try {
    console.log('Testing complete message wall functionality...');
    
    // 1. 验证测试用户存在
    const user1 = await prisma.user.findUnique({
      where: { email: 'test1@example.com' },
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { email: 'test2@example.com' },
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });
    
    if (!user1 || !user2) {
      console.log('Test users not found. Please run test-message-wall.js first.');
      return;
    }
    
    console.log('✓ Test users found');
    console.log('User 1:', { id: user1.id, name: user1.displayName, coupleId: user1.coupleId });
    console.log('User 2:', { id: user2.id, name: user2.displayName, coupleId: user2.coupleId });
    
    // 2. 验证情侣关系
    if (!user1.couple || !user1.couple.isComplete) {
      console.log('❌ User 1 does not have a complete couple relationship');
      return;
    }
    
    if (!user2.couple || !user2.couple.isComplete) {
      console.log('❌ User 2 does not have a complete couple relationship');
      return;
    }
    
    console.log('✓ Couple relationship verified');
    console.log('Couple:', { id: user1.couple.id, name: user1.couple.name, isComplete: user1.couple.isComplete });
    
    // 3. 测试留言功能
    console.log('\n--- Testing Message Creation ---');
    
    // 创建文本留言
    const textMessage = await prisma.messageWallPost.create({
      data: {
        senderId: user1.id,
        receiverId: user2.id,
        content: '这是一条测试留言！🎉',
        messageType: 'TEXT'
      }
    });
    console.log('✓ Text message created:', textMessage.id);
    
    // 创建小惊喜留言
    const surpriseMessage = await prisma.messageWallPost.create({
      data: {
        senderId: user2.id,
        receiverId: user1.id,
        content: '给你一个小惊喜！',
        messageType: 'SURPRISE',
        surpriseType: 'confetti',
        surpriseData: JSON.stringify({ type: 'confetti', duration: 3000 })
      }
    });
    console.log('✓ Surprise message created:', surpriseMessage.id);
    
    // 4. 测试反应功能
    console.log('\n--- Testing Message Reactions ---');
    
    const reaction1 = await prisma.messageReaction.create({
      data: {
        userId: user2.id,
        messageId: textMessage.id,
        emoji: '❤️'
      }
    });
    console.log('✓ Reaction added:', reaction1.emoji);
    
    const reaction2 = await prisma.messageReaction.create({
      data: {
        userId: user1.id,
        messageId: surpriseMessage.id,
        emoji: '😍'
      }
    });
    console.log('✓ Reaction added:', reaction2.emoji);
    
    // 5. 测试留言查询
    console.log('\n--- Testing Message Retrieval ---');
    
    const coupleUserIds = [user1.id, user2.id];
    const messages = await prisma.messageWallPost.findMany({
      where: {
        AND: [
          { senderId: { in: coupleUserIds } },
          { receiverId: { in: coupleUserIds } },
          { isDeleted: false }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            displayName: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✓ Found ${messages.length} messages`);
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.sender.displayName} -> ${msg.receiver.displayName}: ${msg.content}`);
      if (msg.reactions.length > 0) {
        console.log(`     Reactions: ${msg.reactions.map(r => `${r.emoji} (${r.user.displayName})`).join(', ')}`);
      }
    });
    
    // 6. 测试留言标记为已读
    console.log('\n--- Testing Mark as Read ---');
    
    await prisma.messageWallPost.update({
      where: { id: textMessage.id },
      data: { isRead: true }
    });
    console.log('✓ Message marked as read');
    
    // 7. 生成JWT token用于API测试
    console.log('\n--- API Testing Information ---');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token1 = jwt.sign({ userId: user1.id }, jwtSecret, { expiresIn: '1h' });
    const token2 = jwt.sign({ userId: user2.id }, jwtSecret, { expiresIn: '1h' });
    
    console.log('已为两个测试用户生成 API 测试 token:', Boolean(token1 && token2));
    
    console.log('\n--- Test API Endpoints ---');
    console.log('You can test the following API endpoints:');
    console.log('1. GET /api/messages - Get all messages');
    console.log('2. POST /api/messages - Send a new message');
    console.log('3. DELETE /api/messages/[id] - Delete a message');
    console.log('4. PATCH /api/messages/[id] - Mark message as read');
    console.log('5. POST /api/messages/[id]/reactions - Add/remove reaction');
    console.log('6. GET /api/messages/[id]/reactions - Get message reactions');
    
    console.log('\n🎉 All tests passed! Message wall functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessageWallComplete();
