const { PrismaClient } = require('./src/generated/prisma');
// 使用Node.js 18+内置的fetch API

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

// 测试用户数据
const testUser1 = {
  username: 'testuser1_refresh',
  email: 'testuser1_refresh@example.com',
  password: 'password123',
  displayName: 'Test User 1',
  gender: 'male'
};

const testUser2 = {
  username: 'testuser2_refresh', 
  email: 'testuser2_refresh@example.com',
  password: 'password123',
  displayName: 'Test User 2',
  gender: 'female'
};

async function cleanupTestData() {
  console.log('🧹 清理测试数据...');
  
  try {
    // 删除测试用户
    await prisma.user.deleteMany({
      where: {
        OR: [
          { username: testUser1.username },
          { username: testUser2.username },
          { email: testUser1.email },
          { email: testUser2.email }
        ]
      }
    });
    
    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error.message);
  }
}

async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  return { response, data };
}

async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  const cookies = response.headers.get('set-cookie');
  return { response, data, cookies };
}

async function getCurrentUser(cookies) {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Cookie': cookies || ''
    }
  });
  
  const data = await response.json();
  return { response, data };
}

async function generateInviteCode(cookies) {
  const response = await fetch(`${BASE_URL}/api/couples/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || ''
    }
  });
  
  const data = await response.json();
  return { response, data };
}

async function joinByInviteCode(code, cookies) {
  const response = await fetch(`${BASE_URL}/api/couples/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || ''
    },
    body: JSON.stringify({ inviteCode: code })
  });
  
  const data = await response.json();
  return { response, data };
}

async function testStateRefresh() {
  console.log('🧪 开始测试前端状态自动刷新功能...');
  
  try {
    // 1. 清理测试数据
    await cleanupTestData();
    
    // 2. 注册两个测试用户
    console.log('\n📝 注册测试用户...');
    
    const { response: regResp1, data: regData1 } = await registerUser(testUser1);
    if (!regResp1.ok) {
      throw new Error(`用户1注册失败: ${regData1.error}`);
    }
    console.log('✅ 用户1注册成功:', regData1.user.username);
    
    const { response: regResp2, data: regData2 } = await registerUser(testUser2);
    if (!regResp2.ok) {
      throw new Error(`用户2注册失败: ${regData2.error}`);
    }
    console.log('✅ 用户2注册成功:', regData2.user.username);
    
    // 3. 用户1登录
    console.log('\n🔐 用户1登录...');
    const { response: loginResp1, data: loginData1, cookies: cookies1 } = await loginUser({
      username: testUser1.username,
      password: testUser1.password
    });
    
    if (!loginResp1.ok) {
      throw new Error(`用户1登录失败: ${loginData1.error}`);
    }
    console.log('✅ 用户1登录成功');
    
    // 4. 测试 /api/auth/me 端点
    console.log('\n🔍 测试获取当前用户信息...');
    const { response: meResp1, data: meData1 } = await getCurrentUser(cookies1);
    
    if (!meResp1.ok) {
      throw new Error(`获取用户信息失败: ${meData1.error}`);
    }
    
    console.log('✅ 成功获取用户信息:');
    console.log('  - 用户ID:', meData1.user.id);
    console.log('  - 用户名:', meData1.user.username);
    console.log('  - 情侣ID:', meData1.user.coupleId || '未配对');
    
    // 5. 用户2登录
    console.log('\n🔐 用户2登录...');
    const { response: loginResp2, data: loginData2, cookies: cookies2 } = await loginUser({
      username: testUser2.username,
      password: testUser2.password
    });
    
    if (!loginResp2.ok) {
      throw new Error(`用户2登录失败: ${loginData2.error}`);
    }
    console.log('✅ 用户2登录成功');
    
    // 6. 用户1生成邀请码
    console.log('\n💌 用户1生成邀请码...');
    const { response: inviteResp, data: inviteData } = await generateInviteCode(cookies1);
    
    if (!inviteResp.ok) {
      throw new Error(`生成邀请码失败: ${inviteData.error}`);
    }
    
    const inviteCode = inviteData.couple?.inviteCode;
    if (!inviteCode) {
      throw new Error('邀请码生成失败: 未获取到邀请码');
    }
    console.log('✅ 邀请码生成成功:', inviteCode);
    
    // 7. 用户2使用邀请码加入
    console.log('\n💕 用户2使用邀请码加入...');
    const { response: joinResp, data: joinData } = await joinByInviteCode(inviteCode, cookies2);
    
    if (!joinResp.ok) {
      throw new Error(`加入失败: ${joinData.error}`);
    }
    console.log('✅ 用户2成功加入情侣');
    
    // 8. 验证双方状态更新
    console.log('\n🔄 验证状态更新...');
    
    // 检查用户1的最新状态
    const { response: meResp1After, data: meData1After } = await getCurrentUser(cookies1);
    if (!meResp1After.ok) {
      throw new Error(`获取用户1更新后信息失败: ${meData1After.error}`);
    }
    
    // 检查用户2的最新状态
    const { response: meResp2After, data: meData2After } = await getCurrentUser(cookies2);
    if (!meResp2After.ok) {
      throw new Error(`获取用户2更新后信息失败: ${meData2After.error}`);
    }
    
    console.log('\n📊 状态验证结果:');
    console.log('用户1:');
    console.log('  - 情侣ID:', meData1After.user.coupleId);
    console.log('  - 情侣信息:', meData1After.couple ? '已获取' : '未获取');
    
    console.log('用户2:');
    console.log('  - 情侣ID:', meData2After.user.coupleId);
    console.log('  - 情侣信息:', meData2After.couple ? '已获取' : '未获取');
    
    // 验证状态一致性
    if (meData1After.user.coupleId && meData2After.user.coupleId && 
        meData1After.user.coupleId === meData2After.user.coupleId) {
      console.log('\n✅ 状态刷新功能测试通过!');
      console.log('  - 双方都有正确的情侣ID');
      console.log('  - 情侣ID一致:', meData1After.user.coupleId);
      
      if (meData1After.couple && meData2After.couple) {
        console.log('  - 双方都能获取到情侣信息');
        console.log('  - 情侣状态:', meData1After.couple.isComplete ? '已完成配对' : '配对中');
      }
    } else {
      console.log('\n❌ 状态刷新功能存在问题:');
      console.log('  - 用户1情侣ID:', meData1After.user.coupleId);
      console.log('  - 用户2情侣ID:', meData2After.user.coupleId);
      console.log('  - 情侣ID不一致或为空');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    // 清理测试数据
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

// 运行测试
testStateRefresh();