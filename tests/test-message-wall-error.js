// 使用Node.js内置的fetch API

async function testMessageWall() {
  try {
    console.log('🧪 测试留言墙功能...');
    
    // 1. 登录用户
    console.log('\n--- 登录用户 ---');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'user123'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ 登录失败:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ 登录成功:', loginData.user.displayName);
    
    // 获取cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 获取到cookies:', cookies ? '是' : '否');
    
    // 2. 测试获取留言列表
    console.log('\n--- 测试获取留言列表 ---');
    const messagesResponse = await fetch('http://localhost:3000/api/messages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });
    
    console.log('📊 留言API状态码:', messagesResponse.status);
    
    if (!messagesResponse.ok) {
      const error = await messagesResponse.json();
      console.error('❌ 获取留言失败:', error);
      
      // 如果是400错误，可能是没有情侣关系
      if (messagesResponse.status === 400) {
        console.log('💡 可能原因: 用户没有建立情侣关系');
      }
      return;
    }
    
    const messagesData = await messagesResponse.json();
    console.log('✅ 成功获取留言:', messagesData.messages.length, '条');
    
    // 3. 测试发送留言
    console.log('\n--- 测试发送留言 ---');
    const sendResponse = await fetch('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        content: '测试留言内容',
        messageType: 'TEXT',
        visibility: 'PRIVATE'
      })
    });
    
    console.log('📊 发送留言状态码:', sendResponse.status);
    console.log('📊 响应头:', Object.fromEntries(sendResponse.headers.entries()));
    
    const responseText = await sendResponse.text();
    console.log('📊 原始响应:', responseText);
    
    let sendData;
    try {
      sendData = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ 响应不是有效的JSON:', e.message);
      sendData = { error: 'Invalid JSON response', raw: responseText };
    }
    
    if (sendResponse.ok) {
      console.log('✅ 发送留言成功:', sendData);
    } else {
      console.log('❌ 发送留言失败:', sendData);
    }
    
    console.log('\n🎉 留言墙功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

testMessageWall();