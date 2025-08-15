// 使用Node.js内置的fetch API (Node 18+)

const BASE_URL = 'http://localhost:3000';

async function testAdminAuth() {
  console.log('测试管理员认证...');
  
  try {
    // 1. 尝试管理员登录
    console.log('\n1. 测试管理员登录...');
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
    
    if (!loginResponse.ok) {
      console.log('❌ 管理员登录失败');
      return;
    }
    
    // 获取cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie 头:', setCookieHeader);
    
    if (!setCookieHeader) {
      console.log('❌ 没有设置cookie');
      return;
    }
    
    // 提取admin_token
    const adminTokenMatch = setCookieHeader.match(/admin_token=([^;]+)/);
    if (!adminTokenMatch) {
      console.log('❌ 没有找到admin_token cookie');
      return;
    }
    
    const adminToken = adminTokenMatch[1];
    console.log('✅ 管理员登录成功，获得token:', adminToken.substring(0, 20) + '...');
    
    // 2. 使用admin token访问主页
    console.log('\n2. 使用admin token访问主页...');
    const homeResponse = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${adminToken}`
      },
      redirect: 'manual' // 不自动跟随重定向
    });
    
    console.log('主页访问状态码:', homeResponse.status);
    console.log('主页响应头:', Object.fromEntries(homeResponse.headers.entries()));
    
    if (homeResponse.status === 307 || homeResponse.status === 302) {
      const location = homeResponse.headers.get('location');
      console.log('❌ 管理员被重定向到:', location);
    } else if (homeResponse.status === 200) {
      console.log('✅ 管理员可以正常访问主页');
    } else {
      console.log('❓ 意外的响应状态码:', homeResponse.status);
    }
    
    // 3. 测试维护模式API访问
    console.log('\n3. 测试维护模式API访问...');
    const maintenanceResponse = await fetch(`${BASE_URL}/api/admin/maintenance`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${adminToken}`
      }
    });
    
    console.log('维护模式API状态码:', maintenanceResponse.status);
    const maintenanceData = await maintenanceResponse.json();
    console.log('维护模式API响应:', JSON.stringify(maintenanceData, null, 2));
    
    if (maintenanceResponse.ok) {
      console.log('✅ 管理员可以访问维护模式API');
    } else {
      console.log('❌ 管理员无法访问维护模式API');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testAdminAuth();