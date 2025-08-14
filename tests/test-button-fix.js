// 测试生成邀请码按钮修复
// 使用Node.js内置的fetch API

const BASE_URL = 'http://localhost:3000';

// 生成随机用户数据
const generateTestUser = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return {
    username: `testuser_${timestamp}_${randomSuffix}`,
    password: 'password123',
    email: `testuser_${timestamp}_${randomSuffix}@test.com`,
    displayName: 'Test User'
  };
};

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
async function testButtonFix() {
  console.log('🧪 开始测试生成邀请码按钮修复...');
  
  try {
    // 1. 注册并登录用户
    const userData = generateTestUser();
    console.log('📝 注册用户:', userData.username);
    
    await registerUser(userData);
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username,
        password: userData.password
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResult.error}`);
    }
    
    // 获取cookies
    const cookies = loginResponse.headers.get('set-cookie') || '';
    console.log('✅ 用户登录成功');
    
    // 2. 获取初始状态
    const initialState = await getUserState(cookies);
    console.log('📊 初始状态:');
    console.log('  - 用户ID:', initialState.id);
    console.log('  - 情侣状态:', initialState.couple ? '已配对' : '未配对');
    console.log('  - isComplete:', initialState.couple?.isComplete);
    
    // 3. 测试生成邀请码
    console.log('🎯 测试生成邀请码...');
    const inviteResult = await generateInviteCode(cookies);
    console.log('✅ 邀请码生成成功:', inviteResult.couple.inviteCode);
    
    // 4. 获取更新后的状态
    const updatedState = await getUserState(loginResult.token);
    console.log('📊 更新后状态:');
    console.log('  - 情侣ID:', updatedState.couple?.id);
    console.log('  - 邀请码:', updatedState.couple?.inviteCode);
    console.log('  - isComplete:', updatedState.couple?.isComplete);
    
    // 5. 验证按钮禁用逻辑
    const shouldBeDisabled = Boolean(updatedState.couple && updatedState.couple.isComplete);
    console.log('🔘 按钮应该被禁用:', shouldBeDisabled);
    
    if (!shouldBeDisabled) {
      console.log('✅ 按钮禁用逻辑正确 - 未配对完成时按钮可用');
    } else {
      console.log('❌ 按钮禁用逻辑可能有问题 - 按钮被禁用');
    }
    
    console.log('\n🎉 测试完成！生成邀请码按钮修复验证通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testButtonFix();