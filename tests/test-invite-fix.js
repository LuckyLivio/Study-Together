const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3000';

async function testInviteFix() {
  try {
    console.log('=== 测试邀请码功能修复 ===');
    
    // 清理测试数据
    console.log('\n1. 清理测试数据...');
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'testuser' },
          { username: { startsWith: 'testuser2_' } }
        ]
      }
    });
    
    for (const user of testUsers) {
      // 删除相关情侣记录
      await prisma.couple.deleteMany({
        where: {
          OR: [
            { person1Id: user.id },
            { person2Id: user.id }
          ]
        }
      });
      
      // 清理用户的coupleId
      await prisma.user.update({
        where: { id: user.id },
        data: { coupleId: null }
      });
    }
    
    console.log('✓ 测试数据已清理');
    
    // 2. 用户1登录
    console.log('\n2. 用户1登录...');
    const login1Response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const login1Data = await login1Response.json();
    if (!login1Data.user) {
      console.log('用户1登录失败:', login1Data);
      return;
    }
    console.log('✓ 用户1登录成功');
    
    // 3. 生成邀请码
    console.log('\n3. 生成邀请码...');
    const cookies1 = login1Response.headers.get('set-cookie');
    
    const inviteResponse = await fetch(`${baseUrl}/api/couples/invite`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies1 || ''
      }
    });
    
    const inviteData = await inviteResponse.json();
    if (!inviteData.success) {
      console.log('生成邀请码失败:', inviteData);
      return;
    }
    const inviteCode = inviteData.couple.inviteCode;
    console.log('✓ 邀请码生成成功:', inviteCode);
    
    // 4. 注册新用户
    console.log('\n4. 注册新用户...');
    const timestamp = Date.now();
    const username2 = `testuser2_${timestamp}`;
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username2,
        password: 'password123',
        email: `${username2}@test.com`,
        displayName: 'Test User 2'
      })
    });
    
    const registerData = await registerResponse.json();
    if (!registerData.user) {
      console.log('注册失败:', registerData);
      return;
    }
    console.log('✓ 新用户注册成功:', username2);
    
    // 5. 新用户使用邀请码加入
    console.log('\n5. 新用户使用邀请码加入...');
    const cookies2 = registerResponse.headers.get('set-cookie');
    
    const joinResponse = await fetch(`${baseUrl}/api/couples/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies2 || ''
      },
      body: JSON.stringify({ inviteCode: inviteCode })
    });
    
    const joinData = await joinResponse.json();
    if (!joinData.success) {
      console.log('加入失败:', joinData);
      return;
    }
    console.log('✓ 新用户成功加入情侣');
    
    // 6. 检查数据库中的用户状态
    console.log('\n6. 检查数据库中的用户状态...');
    
    const user1Updated = await prisma.user.findUnique({
      where: { username: 'testuser' },
      include: { couple: true }
    });
    
    const user2Updated = await prisma.user.findUnique({
      where: { username: username2 },
      include: { couple: true }
    });
    
    console.log('\n用户1状态:');
    console.log('- coupleId:', user1Updated?.coupleId);
    console.log('- couple对象:', user1Updated?.couple ? '存在' : '不存在');
    
    console.log('\n用户2状态:');
    console.log('- coupleId:', user2Updated?.coupleId);
    console.log('- couple对象:', user2Updated?.couple ? '存在' : '不存在');
    
    // 7. 验证修复结果
    console.log('\n7. 验证修复结果...');
    
    if (user1Updated?.coupleId && user2Updated?.coupleId && 
        user1Updated.coupleId === user2Updated.coupleId) {
      console.log('✓ 修复成功：双方用户的coupleId都已正确设置且一致');
      console.log('✓ 情侣ID:', user1Updated.coupleId);
    } else {
      console.log('✗ 修复失败：用户的coupleId不一致');
      console.log('- 用户1 coupleId:', user1Updated?.coupleId);
      console.log('- 用户2 coupleId:', user2Updated?.coupleId);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInviteFix();