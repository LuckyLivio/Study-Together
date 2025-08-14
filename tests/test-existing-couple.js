// 测试已有情侣关系的用户按钮状态
const BASE_URL = 'http://localhost:3000';

// 注册用户
async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`注册失败: ${result.error}`);
  }
  
  return result;
}

// 登录用户
async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`登录失败: ${result.error}`);
  }
  
  return { result, cookies: response.headers.get('set-cookie') || '' };
}

// 获取用户状态
async function getUserState(cookies) {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Cookie': cookies
    }
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`获取用户状态失败: ${result.error}`);
  }
  
  return result;
}

// 生成邀请码
async function generateInviteCode(cookies) {
  const response = await fetch(`${BASE_URL}/api/couples/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`生成邀请码失败: ${result.error}`);
  }
  
  return result;
}

// 加入情侣关系
async function joinCouple(inviteCode, cookies) {
  const response = await fetch(`${BASE_URL}/api/couples/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ inviteCode })
  });
  
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`加入情侣关系失败: ${result.error}`);
  }
  
  return result;
}

// 主测试函数
async function testExistingCouple() {
  try {
    console.log('🧪 开始测试已有情侣关系的按钮状态...');
    
    // 1. 创建两个用户
    const user1Data = {
      username: `user1_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      password: 'password123',
      email: `user1_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@test.com`,
      displayName: 'User 1'
    };
    
    const user2Data = {
      username: `user2_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      password: 'password123',
      email: `user2_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@test.com`,
      displayName: 'User 2'
    };
    
    console.log('📝 注册用户1:', user1Data.username);
    await registerUser(user1Data);
    
    console.log('📝 注册用户2:', user2Data.username);
    await registerUser(user2Data);
    
    // 2. 用户1登录并生成邀请码
    const { result: login1Result, cookies: cookies1 } = await loginUser({
      username: user1Data.username,
      password: user1Data.password
    });
    
    console.log('✅ 用户1登录成功');
    
    const inviteResult = await generateInviteCode(cookies1);
    console.log('✅ 用户1生成邀请码:', inviteResult.couple.inviteCode);
    
    // 3. 用户2登录并加入情侣关系
    const { result: login2Result, cookies: cookies2 } = await loginUser({
      username: user2Data.username,
      password: user2Data.password
    });
    
    console.log('✅ 用户2登录成功');
    
    await joinCouple(inviteResult.couple.inviteCode, cookies2);
    console.log('✅ 用户2加入情侣关系成功');
    
    // 4. 检查用户1的状态（应该有完成的couple关系）
    const user1State = await getUserState(cookies1);
    const user1 = user1State.user;
    const couple1 = user1State.couple;
    
    console.log('📊 用户1状态:');
    console.log('  - 用户ID:', user1.id);
    console.log('  - 用户名:', user1.username);
    console.log('  - 情侣ID:', user1.coupleId);
    console.log('  - 情侣状态:', couple1 ? '已配对' : '未配对');
    
    if (couple1) {
      console.log('  - 情侣完成状态:', couple1.isComplete);
      console.log('  - 邀请码:', couple1.inviteCode);
    }
    
    // 5. 分析按钮状态
    const isGenerating = false;
    const buttonDisabled = isGenerating || Boolean(couple1 && couple1.isComplete);
    
    console.log('🔍 用户1按钮状态分析:');
    console.log('  - isGenerating:', isGenerating);
    console.log('  - couple存在:', !!couple1);
    console.log('  - couple.isComplete:', couple1?.isComplete);
    console.log('  - 按钮应该被禁用:', buttonDisabled);
    
    if (buttonDisabled) {
      console.log('❌ 按钮被禁用的原因:');
      if (isGenerating) console.log('  - 正在生成中');
      if (couple1 && couple1.isComplete) console.log('  - 情侣关系已完成');
      console.log('💡 解决方案: 修改按钮禁用逻辑，允许已完成情侣关系的用户重新生成邀请码');
    } else {
      console.log('✅ 按钮应该可以点击');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testExistingCouple();