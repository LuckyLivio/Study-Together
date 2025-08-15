const { PrismaClient } = require('../src/generated/prisma');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function debugFrontendState() {
  try {
    console.log('调试前端状态显示问题...');
    
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
    
    console.log(`\n=== 数据库状态 ===`);
    console.log(`找到 ${usersWithCouple.length} 个有情侣关联的用户`);
    
    for (const user of usersWithCouple) {
      console.log(`\n用户: ${user.username} (${user.id})`);
      console.log(`邮箱: ${user.email}`);
      console.log(`情侣ID: ${user.coupleId}`);
      console.log(`情侣状态: ${user.couple ? (user.couple.isComplete ? '已完成' : '未完成') : '无'}`);
      
      if (user.couple) {
        console.log(`邀请码: ${user.couple.inviteCode}`);
        console.log(`创建时间: ${user.couple.createdAt}`);
        
        // 生成JWT token来测试API
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email,
            username: user.username 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log(`\n=== 测试 /api/auth/me 接口 ===`);
        
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `token=${token}`
            }
          });
          
          const responseText = await response.text();
          console.log(`状态码: ${response.status}`);
          console.log(`响应内容:`);
          
          try {
            const data = JSON.parse(responseText);
            console.log(JSON.stringify(data, null, 2));
            
            // 检查响应数据的完整性
            if (data.user) {
              console.log(`\n=== 数据完整性检查 ===`);
              console.log(`用户ID匹配: ${data.user.id === user.id}`);
              console.log(`情侣ID匹配: ${data.user.coupleId === user.coupleId}`);
              console.log(`情侣对象存在: ${!!data.couple}`);
              if (data.couple) {
                console.log(`情侣完成状态: ${data.couple.isComplete}`);
                console.log(`邀请码: ${data.couple.inviteCode}`);
              }
            }
          } catch (parseError) {
            console.log(`JSON解析失败: ${parseError.message}`);
            console.log(`原始响应: ${responseText}`);
          }
        } catch (fetchError) {
          console.log(`API请求失败: ${fetchError.message}`);
        }
        
        console.log('\n' + '='.repeat(50));
      }
    }
    
    // 检查所有情侣记录
    console.log(`\n=== 所有情侣记录 ===`);
    const allCouples = await prisma.couple.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`总共 ${allCouples.length} 个情侣记录:`);
    allCouples.forEach((couple, index) => {
      console.log(`${index + 1}. ID: ${couple.id}`);
      console.log(`   邀请码: ${couple.inviteCode}`);
      console.log(`   完成状态: ${couple.isComplete}`);
      console.log(`   Person1: ${couple.person1Name} (${couple.person1Id})`);
      console.log(`   Person2: ${couple.person2Name || 'null'} (${couple.person2Id || 'null'})`);
      console.log(`   创建时间: ${couple.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendState();