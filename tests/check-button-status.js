// 检查生成邀请码按钮状态的测试脚本
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

// 主测试函数
async function testButtonStatus() {
  try {
    console.log('🧪 开始检查按钮状态...');
    
    // 1. 注册并登录用户
    const userData = {
      username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      password: 'password123',
      email: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@test.com`,
      displayName: 'Test User'
    };
    
    console.log('📝 注册用户:', userData.username);
    await registerUser(userData);
    
    const { result: loginResult, cookies } = await loginUser({
      username: userData.username,
      password: userData.password
    });
    
    console.log('✅ 用户登录成功');
    console.log('🍪 已收到 Cookies:', Boolean(cookies));
    
    // 2. 获取用户状态
    const response = await getUserState(cookies);
    const user = response.user;
    const couple = response.couple;
    
    console.log('📊 用户状态:');
    console.log('  - 用户ID:', user.id);
    console.log('  - 用户名:', user.username);
    console.log('  - 情侣ID:', user.coupleId);
    console.log('  - 情侣状态:', couple ? '已配对' : '未配对');
    
    if (couple) {
      console.log('  - 情侣完成状态:', couple.isComplete);
      console.log('  - 邀请码:', couple.inviteCode);
    }
    
    // 3. 分析按钮状态
    const isGenerating = false; // 初始状态
    const buttonDisabled = isGenerating || Boolean(couple && couple.isComplete);
    
    console.log('🔍 按钮状态分析:');
    console.log('  - isGenerating:', isGenerating);
    console.log('  - couple存在:', !!couple);
    console.log('  - couple.isComplete:', couple?.isComplete);
    console.log('  - 按钮应该被禁用:', buttonDisabled);
    
    if (buttonDisabled) {
      console.log('❌ 按钮被禁用的原因:');
      if (isGenerating) console.log('  - 正在生成中');
      if (couple && couple.isComplete) console.log('  - 情侣关系已完成');
    } else {
      console.log('✅ 按钮应该可以点击');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testButtonStatus();
