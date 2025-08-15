// 直接测试维护模式功能的脚本
const http = require('http');

// 测试不带任何认证信息的请求
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'Test-Client/1.0'
  }
};

console.log('测试维护模式重定向...');
console.log('发送不带认证信息的请求到 http://localhost:3000/');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头:`, res.headers);
  
  if (res.statusCode === 302 || res.statusCode === 307) {
    console.log('✅ 维护模式重定向正常工作!');
    console.log(`重定向到: ${res.headers.location}`);
  } else if (res.statusCode === 200) {
    console.log('❌ 维护模式重定向未生效，返回了正常页面');
  } else {
    console.log(`⚠️  意外的状态码: ${res.statusCode}`);
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (data.includes('维护') || data.includes('maintenance')) {
      console.log('✅ 响应内容包含维护相关信息');
    } else if (res.statusCode === 200) {
      console.log('❌ 响应内容不包含维护信息，可能是正常页面');
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();