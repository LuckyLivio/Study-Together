// 使用Node.js内置的fetch API (Node 18+)

// 测试安全设置保存功能
async function testSecuritySettings() {
  console.log('🔒 开始测试安全设置保存功能...');
  
  try {
    // 1. 首先登录管理员账户获取token
    console.log('📝 登录管理员账户...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 管理员登录成功');
    
    // 2. 获取当前安全设置
    console.log('📋 获取当前安全设置...');
    const getResponse = await fetch('http://localhost:3000/api/admin/security', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!getResponse.ok) {
      throw new Error(`获取安全设置失败: ${getResponse.status}`);
    }
    
    const currentSettings = await getResponse.json();
    console.log('✅ 当前安全设置:', JSON.stringify(currentSettings.settings, null, 2));
    
    // 3. 更新安全设置
    console.log('💾 更新安全设置...');
    const updatedSettings = {
      ...currentSettings.settings,
      maxLoginAttempts: 3,
      lockoutDuration: 30,
      allowedIPs: '192.168.1.100, 10.0.0.1',
      passwordPolicy: {
        ...currentSettings.settings.passwordPolicy,
        minLength: 10,
        requireSpecialChars: true
      }
    };
    
    const updateResponse = await fetch('http://localhost:3000/api/admin/security', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ settings: updatedSettings })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`更新安全设置失败: ${updateResponse.status} - ${errorData.error}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ 安全设置更新成功:', JSON.stringify(updateResult.settings, null, 2));
    
    // 4. 验证设置是否保存成功
    console.log('🔍 验证设置是否保存成功...');
    const verifyResponse = await fetch('http://localhost:3000/api/admin/security', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`验证安全设置失败: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    const savedSettings = verifyData.settings;
    
    // 检查关键设置是否正确保存
    const checks = [
      { name: '最大登录尝试次数', expected: 3, actual: savedSettings.maxLoginAttempts },
      { name: '锁定时长', expected: 30, actual: savedSettings.lockoutDuration },
      { name: 'IP白名单', expected: '192.168.1.100, 10.0.0.1', actual: savedSettings.allowedIPs },
      { name: '密码最小长度', expected: 10, actual: savedSettings.passwordPolicy.minLength },
      { name: '需要特殊字符', expected: true, actual: savedSettings.passwordPolicy.requireSpecialChars }
    ];
    
    let allPassed = true;
    for (const check of checks) {
      if (check.actual === check.expected) {
        console.log(`✅ ${check.name}: ${check.actual}`);
      } else {
        console.log(`❌ ${check.name}: 期望 ${check.expected}, 实际 ${check.actual}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('🎉 所有安全设置保存验证通过！');
    } else {
      console.log('⚠️ 部分安全设置保存失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testSecuritySettings();