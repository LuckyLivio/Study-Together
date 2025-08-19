// 使用Node.js 18+内置的fetch API

const BASE_URL = 'http://localhost:3000';

async function testAdminSecurity() {
  console.log('🔐 测试管理员安全设置功能...');
  
  try {
    // 1. 管理员登录
    console.log('\n1. 管理员登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok || !loginData.success) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    const adminToken = loginData.token;
    console.log('✅ 管理员登录成功，token:', adminToken.substring(0, 20) + '...');
    
    // 2. 获取安全设置
    console.log('\n2. 获取安全设置...');
    const getResponse = await fetch(`${BASE_URL}/api/admin/security`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });
    
    console.log('获取安全设置状态:', getResponse.status);
    const getData = await getResponse.json();
    console.log('获取安全设置响应:', JSON.stringify(getData, null, 2));
    
    if (!getResponse.ok) {
      console.log('❌ 获取安全设置失败');
      return;
    }
    
    console.log('✅ 成功获取安全设置');
    
    // 3. 更新安全设置
    console.log('\n3. 更新安全设置...');
    const updatedSettings = {
      ...getData.settings,
      maxLoginAttempts: 6, // 修改一个值
      lockoutDuration: 20
    };
    
    const updateResponse = await fetch(`${BASE_URL}/api/admin/security`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ settings: updatedSettings })
    });
    
    console.log('更新安全设置状态:', updateResponse.status);
    const updateData = await updateResponse.json();
    console.log('更新安全设置响应:', JSON.stringify(updateData, null, 2));
    
    if (!updateResponse.ok) {
      console.log('❌ 更新安全设置失败');
      return;
    }
    
    console.log('✅ 成功更新安全设置');
    
    // 4. 验证更新是否生效
    console.log('\n4. 验证更新是否生效...');
    const verifyResponse = await fetch(`${BASE_URL}/api/admin/security`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });
    
    const verifyData = await verifyResponse.json();
    console.log('验证响应:', JSON.stringify(verifyData, null, 2));
    
    if (verifyData.settings.maxLoginAttempts === 6 && verifyData.settings.lockoutDuration === 20) {
      console.log('✅ 安全设置更新成功并已生效');
    } else {
      console.log('❌ 安全设置更新未生效');
      console.log('期望: maxLoginAttempts=6, lockoutDuration=20');
      console.log('实际:', `maxLoginAttempts=${verifyData.settings.maxLoginAttempts}, lockoutDuration=${verifyData.settings.lockoutDuration}`);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testAdminSecurity();