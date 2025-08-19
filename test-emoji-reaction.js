// 测试emoji反应功能

async function testEmojiReaction() {
  try {
    console.log('🧪 测试emoji反应功能...');
    
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
    
    // 2. 获取留言列表，找到一条留言
    console.log('\n--- 获取留言列表 ---');
    const messagesResponse = await fetch('http://localhost:3000/api/messages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });
    
    if (!messagesResponse.ok) {
      const error = await messagesResponse.json();
      console.error('❌ 获取留言失败:', error);
      return;
    }
    
    const messagesData = await messagesResponse.json();
    console.log('✅ 成功获取留言:', messagesData.messages.length, '条');
    
    if (messagesData.messages.length === 0) {
      console.log('❌ 没有留言可以测试反应功能');
      return;
    }
    
    const testMessage = messagesData.messages[0];
    console.log('📝 测试留言ID:', testMessage.id);
    console.log('📝 留言发送者:', testMessage.sender.displayName);
    console.log('📝 留言接收者:', testMessage.receiver.displayName);
    console.log('📝 当前用户ID:', loginData.user.id);
    
    // 3. 测试添加emoji反应
    console.log('\n--- 测试添加emoji反应 ---');
    const reactionResponse = await fetch(`http://localhost:3000/api/messages/${testMessage.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        emoji: '❤️'
      })
    });
    
    console.log('📊 反应API状态码:', reactionResponse.status);
    console.log('📊 响应头:', Object.fromEntries(reactionResponse.headers.entries()));
    
    const responseText = await reactionResponse.text();
    console.log('📊 原始响应:', responseText);
    
    let reactionResult;
    try {
      reactionResult = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ 响应不是有效的JSON:', e.message);
      reactionResult = { error: 'Invalid JSON response', raw: responseText };
    }
    
    if (reactionResponse.ok) {
      console.log('✅ 添加反应成功:', reactionResult);
    } else {
      console.log('❌ 添加反应失败:', reactionResult);
      
      // 如果是403错误，详细分析权限问题
      if (reactionResponse.status === 403) {
        console.log('\n🔍 权限分析:');
        console.log('- 当前用户ID:', loginData.user.id);
        console.log('- 留言发送者ID:', testMessage.senderId);
        console.log('- 留言接收者ID:', testMessage.receiverId);
        console.log('- 用户是发送者?', loginData.user.id === testMessage.senderId);
        console.log('- 用户是接收者?', loginData.user.id === testMessage.receiverId);
      }
    }
    
    console.log('\n🎉 emoji反应功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

testEmojiReaction();