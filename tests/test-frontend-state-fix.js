// 测试前端状态更新修复
const BASE_URL = 'http://localhost:3000';

// 辅助函数：生成随机用户名
function generateUsername() {
  return `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// 辅助函数：登录用户
async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  const data = await response.json();
  const cookies = response.headers.get('set-cookie');
  return { response, data, cookies };
}

// 辅助函数：注册用户
async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  const data = await response.json();
  const cookies = response.headers.get('set-cookie');
  return { response, data, cookies };
}

// 辅助函数：获取当前用户信息
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

// 辅助函数：生成邀请码
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

// 辅助函数：使用邀请码加入
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

// 辅助函数：清理测试数据
async function cleanupTestData(usernames) {
  try {
    const { PrismaClient } = require('../src/generated/prisma');
    const prisma = new PrismaClient();
    
    for (const username of usernames) {
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (user) {
        // 删除相关情侣记录
        await prisma.couple.deleteMany({
          where: {
            OR: [
              { person1Id: user.id },
              { person2Id: user.id }
            ]
          }
        });
        
        // 删除用户
        await prisma.user.delete({
          where: { id: user.id }
        });
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.error('清理测试数据失败:', error.message);
  }
}

// 主测试函数
async function testFrontendStateFix() {
  console.log('=== 测试前端状态更新修复 ===\n');
  
  const testUser1 = {
    username: generateUsername(),
    password: 'password123',
    email: `${generateUsername()}@test.com`,
    displayName: 'Test User 1'
  };
  
  const testUser2 = {
    username: generateUsername(),
    password: 'password123',
    email: `${generateUsername()}@test.com`,
    displayName: 'Test User 2'
  };
  
  try {
    // 1. 注册两个用户
    console.log('📝 注册用户1...');
    const { response: regResp1, data: regData1, cookies: cookies1 } = await registerUser(testUser1);
    
    if (!regResp1.ok) {
      throw new Error(`用户1注册失败: ${regData1.error}`);
    }
    console.log('✅ 用户1注册成功:', testUser1.username);
    
    console.log('📝 注册用户2...');
    const { response: regResp2, data: regData2, cookies: cookies2 } = await registerUser(testUser2);
    
    if (!regResp2.ok) {
      throw new Error(`用户2注册失败: ${regData2.error}`);
    }
    console.log('✅ 用户2注册成功:', testUser2.username);
    
    // 2. 用户1生成邀请码
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
    
    // 3. 验证用户1状态（应该有couple信息但未完成配对）
    console.log('\n🔍 验证用户1状态（生成邀请码后）...');
    const { response: meResp1, data: meData1 } = await getCurrentUser(cookies1);
    
    if (!meResp1.ok) {
      throw new Error(`获取用户1信息失败: ${meData1.error}`);
    }
    
    console.log('用户1当前状态:');
    console.log('  - 用户ID:', meData1.user.id);
    console.log('  - 情侣ID:', meData1.user.coupleId || '未配对');
    console.log('  - 情侣状态:', meData1.couple ? (meData1.couple.isComplete ? '已完成配对' : '等待配对') : '无情侣信息');
    
    // 4. 用户2使用邀请码加入
    console.log('\n💕 用户2使用邀请码加入...');
    const { response: joinResp, data: joinData } = await joinByInviteCode(inviteCode, cookies2);
    
    if (!joinResp.ok) {
      throw new Error(`加入失败: ${joinData.error}`);
    }
    console.log('✅ 用户2成功加入情侣');
    
    // 5. 验证用户2状态（应该有完整的情侣信息）
    console.log('\n🔍 验证用户2状态（加入后）...');
    const { response: meResp2, data: meData2 } = await getCurrentUser(cookies2);
    
    if (!meResp2.ok) {
      throw new Error(`获取用户2信息失败: ${meData2.error}`);
    }
    
    console.log('用户2当前状态:');
    console.log('  - 用户ID:', meData2.user.id);
    console.log('  - 情侣ID:', meData2.user.coupleId || '未配对');
    console.log('  - 伴侣ID:', meData2.user.partnerId || '无伴侣');
    console.log('  - 伴侣名字:', meData2.user.partnerName || '无伴侣名字');
    console.log('  - 情侣状态:', meData2.couple ? (meData2.couple.isComplete ? '已完成配对' : '等待配对') : '无情侣信息');
    
    // 6. 重新验证用户1状态（应该也有完整的情侣信息）
    console.log('\n🔍 重新验证用户1状态（配对完成后）...');
    const { response: meResp1Final, data: meData1Final } = await getCurrentUser(cookies1);
    
    if (!meResp1Final.ok) {
      throw new Error(`获取用户1最终信息失败: ${meData1Final.error}`);
    }
    
    console.log('用户1最终状态:');
    console.log('  - 用户ID:', meData1Final.user.id);
    console.log('  - 情侣ID:', meData1Final.user.coupleId || '未配对');
    console.log('  - 伴侣ID:', meData1Final.user.partnerId || '无伴侣');
    console.log('  - 伴侣名字:', meData1Final.user.partnerName || '无伴侣名字');
    console.log('  - 情侣状态:', meData1Final.couple ? (meData1Final.couple.isComplete ? '已完成配对' : '等待配对') : '无情侣信息');
    
    // 7. 验证修复结果
    console.log('\n📊 验证修复结果...');
    
    const success = (
      meData1Final.user.coupleId && 
      meData2.user.coupleId && 
      meData1Final.user.coupleId === meData2.user.coupleId &&
      meData1Final.couple?.isComplete &&
      meData2.couple?.isComplete &&
      meData1Final.user.partnerId === meData2.user.id &&
      meData2.user.partnerId === meData1Final.user.id
    );
    
    if (success) {
      console.log('✅ 前端状态更新修复测试通过！');
      console.log('✅ 双方用户状态同步正确');
      console.log('✅ 情侣配对完成且状态一致');
    } else {
      console.log('❌ 前端状态更新修复测试失败');
      console.log('❌ 用户状态同步存在问题');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await cleanupTestData([testUser1.username, testUser2.username]);
  }
}

// 运行测试
if (require.main === module) {
  testFrontendStateFix();
}

module.exports = { testFrontendStateFix };