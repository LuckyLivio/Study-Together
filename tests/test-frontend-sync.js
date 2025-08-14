const { PrismaClient } = require('./src/generated/prisma');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testFrontendSync() {
  try {
    console.log('测试前端状态同步问题...');
    
    // 查找有coupleId的用户
    const usersWithCouple = await prisma.user.findMany({
      where: {
        coupleId: {
          not: null
        }
      },
      include: {
        couple: true
      }
    });
    
    console.log(`找到 ${usersWithCouple.length} 个有情侣关联的用户`);
    
    for (const user of usersWithCouple) {
      console.log(`\n用户: ${user.username}`);
      console.log(`情侣ID: ${user.coupleId}`);
      console.log(`情侣状态: ${user.couple ? (user.couple.isComplete ? '已完成' : '未完成') : '无'}`);
      
      if (user.couple) {
        console.log(`邀请码: ${user.couple.inviteCode}`);
        console.log(`Person1: ${user.couple.person1Name} (${user.couple.person1Id})`);
        console.log(`Person2: ${user.couple.person2Name || 'null'} (${user.couple.person2Id || 'null'})`);
        
        // 模拟/api/auth/me接口的响应
        let partnerInfo = null;
        if (user.couple && user.couple.isComplete) {
          const partnerId = user.couple.person1Id === user.id ? user.couple.person2Id : user.couple.person1Id;
          if (partnerId) {
            const partner = await prisma.user.findUnique({
              where: { id: partnerId },
              select: { id: true, displayName: true, username: true }
            });
            if (partner) {
              partnerInfo = {
                id: partner.id,
                name: partner.displayName || partner.username
              };
            }
          }
        }
        
        // 确定用户在情侣关系中的角色
        let coupleRole = null;
        if (user.couple && user.couple.isComplete) {
          coupleRole = user.couple.person1Id === user.id ? 'person1' : 'person2';
        }
        
        const apiResponse = {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            role: coupleRole || user.role,
            coupleId: user.coupleId,
            partnerId: partnerInfo?.id || null,
            partnerName: partnerInfo?.name || null
          },
          couple: user.couple
        };
        
        console.log('模拟API响应:');
        console.log(JSON.stringify(apiResponse, null, 2));
      }
      
      console.log('---');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendSync();