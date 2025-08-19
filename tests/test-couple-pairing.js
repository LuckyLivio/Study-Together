const { PrismaClient } = require('./src/generated/prisma');
// 使用Node.js 18+内置的fetch

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000';

async function testCouplePairing() {
  try {
    console.log('🧪 开始测试情侣配对功能...');
    
    // 1. 创建两个测试用户
    const timestamp = Date.now();
    const user1Data = {
      username: `testuser1_${timestamp}`,
      email: `testuser1_${timestamp}@test.com`,
      password: 'TestPass123!',
      displayName: 'Test User 1',
      gender: 'male'
    };
    
    const user2Data = {
      username: `testuser2_${timestamp}`,
      email: `testuser2_${timestamp}@test.com`,
      password: 'TestPass456!',
      displayName: 'Test User 2',
      gender: 'female'
    };
    
    console.log('📝 注册用户1:', user1Data.username);
    const registerResp1 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1Data)
    });
    
    const registerData1 = await registerResp1.json();
    if (!registerResp1.ok) {
      throw new Error(`用户1注册失败: ${registerData1.error}`);
    }
    console.log('✅ 用户1注册成功');
    
    console.log('📝 注册用户2:', user2Data.username);
    const registerResp2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user2Data)
    });
    
    const registerData2 = await registerResp2.json();
    if (!registerResp2.ok) {
      throw new Error(`用户2注册失败: ${registerData2.error}`);
    }
    console.log('✅ 用户2注册成功');
    
    // 2. 用户1登录
    console.log('\n🔐 用户1登录...');
    const loginResp1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user1Data.username,
        password: user1Data.password
      })
    });
    
    const loginData1 = await loginResp1.json();
    if (!loginResp1.ok) {
      throw new Error(`用户1登录失败: ${loginData1.error}`);
    }
    
    const cookies1 = loginResp1.headers.get('set-cookie');
    console.log('✅ 用户1登录成功');
    
    // 3. 用户1生成邀请码
    console.log('\n💌 用户1生成邀请码...');
    const inviteResp = await fetch(`${BASE_URL}/api/couples/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies1
      }
    });
    
    const inviteData = await inviteResp.json();
    if (!inviteResp.ok) {
      throw new Error(`生成邀请码失败: ${inviteData.error}`);
    }
    
    const inviteCode = inviteData.couple.inviteCode;
    console.log('✅ 邀请码生成成功:', inviteCode);
    
    // 4. 用户2登录
    console.log('\n🔐 用户2登录...');
    const loginResp2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user2Data.username,
        password: user2Data.password
      })
    });
    
    const loginData2 = await loginResp2.json();
    if (!loginResp2.ok) {
      throw new Error(`用户2登录失败: ${loginData2.error}`);
    }
    
    const cookies2 = loginResp2.headers.get('set-cookie');
    console.log('✅ 用户2登录成功');
    
    // 5. 用户2使用邀请码加入
    console.log('\n💕 用户2使用邀请码加入...');
    const joinResp = await fetch(`${BASE_URL}/api/couples/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies2
      },
      body: JSON.stringify({ inviteCode })
    });
    
    const joinData = await joinResp.json();
    if (!joinResp.ok) {
      console.error('❌ 加入失败:', joinData);
      console.error('响应状态:', joinResp.status);
      throw new Error(`加入失败: ${joinData.error}`);
    }
    
    console.log('✅ 用户2成功加入情侣');
    console.log('配对结果:', {
      coupleId: joinData.couple.id,
      isComplete: joinData.couple.isComplete,
      person1: joinData.couple.person1Name,
      person2: joinData.couple.person2Name
    });
    
    // 6. 验证数据库状态
    console.log('\n🔍 验证数据库状态...');
    const dbCouple = await prisma.couple.findUnique({
      where: { inviteCode },
      include: { users: true }
    });
    
    if (dbCouple) {
      console.log('数据库中的情侣记录:');
      console.log('  - 情侣ID:', dbCouple.id);
      console.log('  - 邀请码:', dbCouple.inviteCode);
      console.log('  - 是否完成:', dbCouple.isComplete);
      console.log('  - Person1:', dbCouple.person1Name, '(ID:', dbCouple.person1Id, ')');
      console.log('  - Person2:', dbCouple.person2Name, '(ID:', dbCouple.person2Id, ')');
      console.log('  - 关联用户数量:', dbCouple.users.length);
      
      if (dbCouple.isComplete && dbCouple.person2Id && dbCouple.users.length === 2) {
        console.log('\n🎉 情侣配对功能正常！');
      } else {
        console.log('\n❌ 情侣配对存在问题:');
        if (!dbCouple.isComplete) console.log('  - 情侣记录未标记为完成');
        if (!dbCouple.person2Id) console.log('  - Person2信息未正确设置');
        if (dbCouple.users.length !== 2) console.log('  - 用户关联数量不正确');
      }
    } else {
      console.log('❌ 数据库中找不到情侣记录');
    }
    
    // 7. 测试重复加入
    console.log('\n🔄 测试重复加入...');
    const duplicateJoinResp = await fetch(`${BASE_URL}/api/couples/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies2
      },
      body: JSON.stringify({ inviteCode })
    });
    
    const duplicateJoinData = await duplicateJoinResp.json();
    if (!duplicateJoinResp.ok) {
      console.log('✅ 正确阻止了重复加入:', duplicateJoinData.error);
    } else {
      console.log('❌ 未能阻止重复加入');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCouplePairing();