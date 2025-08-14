// 使用Node.js 18+内置的fetch

// 测试情侣状态同步
async function testCoupleSync() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== 测试情侣状态同步 ===\n');
  
  try {
    // 1. 用户1登录
    console.log('1. 用户1登录...');
    const login1Response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const login1Data = await login1Response.json();
    if (!login1Data.user || !login1Data.token) {
      console.error('用户1登录失败:', login1Data);
      return;
    }
    
    console.log('✓ 用户1登录成功');
    console.log('  - 用户ID:', login1Data.user.id);
    console.log('  - 情侣ID:', login1Data.user.coupleId);
    console.log('  - 伴侣ID:', login1Data.user.partnerId);
    console.log('  - 伴侣名字:', login1Data.user.partnerName);
    console.log('  - 情侣对象:', login1Data.couple ? '存在' : '不存在');
    
    if (login1Data.couple) {
      console.log('  - 情侣完整状态:', login1Data.couple.isComplete);
      console.log('  - Person1:', login1Data.couple.person1Name);
      console.log('  - Person2:', login1Data.couple.person2Name);
    }
    
    // 如果没有情侣关系，创建一个完整的测试流程
    if (!login1Data.user.coupleId) {
      console.log('\n用户1没有情侣关系，开始创建测试流程...');
      
      // 2. 生成邀请码
      console.log('\n2. 生成邀请码...');
      
      // 从登录响应中获取cookie
      const cookies = login1Response.headers.get('set-cookie');
      
      const inviteResponse = await fetch(`${baseUrl}/api/couples/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        }
      });
      
      const inviteData = await inviteResponse.json();
      if (!inviteData.success) {
        console.log('生成邀请码失败:', inviteData);
        return;
      }
      const inviteCode = inviteData.couple.inviteCode;
      console.log('✓ 邀请码生成成功:', inviteCode);
      
      // 3. 注册新用户
      const timestamp = Date.now();
      const newUsername = `testuser2_${timestamp}`;
      const newEmail = `testuser2_${timestamp}@example.com`;
      
      console.log('\n3. 注册新用户...');
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: 'password123',
          displayName: 'Test User 2'
        })
      });
      
      const registerData = await registerResponse.json();
      if (!registerData.user || !registerData.token) {
        console.error('注册失败:', registerData);
        return;
      }
      
      console.log('✓ 新用户注册成功:', newUsername);
      
      // 4. 新用户使用邀请码加入
      console.log('\n4. 新用户使用邀请码加入...');
      
      // 从注册响应中获取cookie
      const registerCookies = registerResponse.headers.get('set-cookie');
      
      const joinResponse = await fetch(`${baseUrl}/api/couples/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': registerCookies || ''
        },
        body: JSON.stringify({ inviteCode: inviteCode })
      });
      
      const joinData = await joinResponse.json();
      if (!joinData.success) {
        console.error('加入失败:', joinData);
        return;
      }
      
      console.log('✓ 新用户成功加入情侣');
      
      // 5. 重新登录两个用户，测试状态同步
      console.log('\n5. 重新登录用户1，检查状态...');
      const relogin1Response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      });
      
      const relogin1Data = await relogin1Response.json();
      console.log('用户1重新登录后:');
      console.log('  - 情侣ID:', relogin1Data.user.coupleId);
      console.log('  - 伴侣ID:', relogin1Data.user.partnerId);
      console.log('  - 伴侣名字:', relogin1Data.user.partnerName);
      console.log('  - 情侣对象:', relogin1Data.couple ? '存在' : '不存在');
      if (relogin1Data.couple) {
        console.log('  - 情侣完整状态:', relogin1Data.couple.isComplete);
      }
      
      console.log('\n6. 重新登录用户2，检查状态...');
      const relogin2Response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: 'password123'
        })
      });
      
      const relogin2Data = await relogin2Response.json();
      console.log('用户2重新登录后:');
      console.log('  - 情侣ID:', relogin2Data.user.coupleId);
      console.log('  - 伴侣ID:', relogin2Data.user.partnerId);
      console.log('  - 伴侣名字:', relogin2Data.user.partnerName);
      console.log('  - 情侣对象:', relogin2Data.couple ? '存在' : '不存在');
      if (relogin2Data.couple) {
        console.log('  - 情侣完整状态:', relogin2Data.couple.isComplete);
      }
      
      // 7. 验证状态一致性
      console.log('\n7. 验证状态一致性...');
      if (relogin1Data.user.coupleId === relogin2Data.user.coupleId) {
        console.log('✓ 情侣ID一致:', relogin1Data.user.coupleId);
      } else {
        console.log('✗ 情侣ID不一致');
      }
      
      if (relogin1Data.user.partnerId === relogin2Data.user.id && 
          relogin2Data.user.partnerId === relogin1Data.user.id) {
        console.log('✓ 伴侣关系正确');
      } else {
        console.log('✗ 伴侣关系错误');
      }
      
      if (relogin1Data.couple && relogin2Data.couple && 
          relogin1Data.couple.isComplete && relogin2Data.couple.isComplete) {
        console.log('✓ 双方都能看到完整的情侣状态');
      } else {
        console.log('✗ 情侣状态不完整或不一致');
      }
      
      return;
    }
    
    // 2. 如果用户1有伴侣，测试伴侣登录
    if (login1Data.user.partnerId) {
      console.log('\n2. 查找伴侣用户...');
      
      // 查询伴侣用户信息
      const { PrismaClient } = require('../src/generated/prisma');
      const prisma = new PrismaClient();
      
      const partner = await prisma.user.findUnique({
        where: { id: login1Data.user.partnerId },
        select: { username: true, email: true }
      });
      
      if (partner) {
        console.log('✓ 找到伴侣用户:', partner.username);
        
        // 3. 伴侣登录
        console.log('\n3. 伴侣登录...');
        const login2Response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: partner.username,
            password: 'password123' // 假设密码相同
          })
        });
        
        const login2Data = await login2Response.json();
        if (login2Data.user && login2Data.token) {
          console.log('✓ 伴侣登录成功');
          console.log('  - 用户ID:', login2Data.user.id);
          console.log('  - 情侣ID:', login2Data.user.coupleId);
          console.log('  - 伴侣ID:', login2Data.user.partnerId);
          console.log('  - 伴侣名字:', login2Data.user.partnerName);
          console.log('  - 情侣对象:', login2Data.couple ? '存在' : '不存在');
          
          if (login2Data.couple) {
            console.log('  - 情侣完整状态:', login2Data.couple.isComplete);
            console.log('  - Person1:', login2Data.couple.person1Name);
            console.log('  - Person2:', login2Data.couple.person2Name);
          }
          
          // 4. 验证双方状态一致性
          console.log('\n4. 验证状态一致性...');
          const user1CoupleId = login1Data.user.coupleId;
          const user2CoupleId = login2Data.user.coupleId;
          const user1PartnerId = login1Data.user.partnerId;
          const user2PartnerId = login2Data.user.partnerId;
          
          if (user1CoupleId === user2CoupleId) {
            console.log('✓ 情侣ID一致:', user1CoupleId);
          } else {
            console.log('✗ 情侣ID不一致:', user1CoupleId, 'vs', user2CoupleId);
          }
          
          if (user1PartnerId === login2Data.user.id && user2PartnerId === login1Data.user.id) {
            console.log('✓ 伴侣关系正确');
          } else {
            console.log('✗ 伴侣关系错误');
            console.log('  用户1的伴侣ID:', user1PartnerId, '(应该是', login2Data.user.id, ')');
            console.log('  用户2的伴侣ID:', user2PartnerId, '(应该是', login1Data.user.id, ')');
          }
          
          if (login1Data.couple && login2Data.couple) {
            if (JSON.stringify(login1Data.couple) === JSON.stringify(login2Data.couple)) {
              console.log('✓ 情侣对象完全一致');
            } else {
              console.log('✗ 情侣对象不一致');
            }
          }
          
        } else {
          console.log('✗ 伴侣登录失败:', login2Data);
        }
      } else {
        console.log('✗ 未找到伴侣用户');
      }
      
      await prisma.$disconnect();
    } else {
      console.log('\n用户1没有伴侣，无法测试同步状态');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testCoupleSync();