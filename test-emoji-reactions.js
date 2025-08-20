// 使用Node.js 18+内置的fetch API

const BASE_URL = 'http://localhost:3000';

async function testEmojiReactions() {
  try {
    console.log('=== 测试 Emoji 反应功能 ===\n');

    // 1. 用户登录
    console.log('1. 用户登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser1',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginData.error}`);
    }

    const token = loginData.token;
    console.log('✅ 登录成功');

    // 2. 获取留言列表
    console.log('\n2. 获取留言列表...');
    const messagesResponse = await fetch(`${BASE_URL}/api/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const messagesData = await messagesResponse.json();
    if (!messagesResponse.ok) {
      throw new Error(`获取留言失败: ${messagesData.error}`);
    }

    console.log(`✅ 获取到 ${messagesData.messages.length} 条留言`);
    
    if (messagesData.messages.length === 0) {
      console.log('❌ 没有留言可以测试反应功能');
      return;
    }

    const firstMessage = messagesData.messages[0];
    console.log(`测试留言ID: ${firstMessage.id}, 可见性: ${firstMessage.visibility}`);

    // 3. 添加emoji反应
    console.log('\n3. 添加emoji反应...');
    const addReactionResponse = await fetch(`${BASE_URL}/api/messages/${firstMessage.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emoji: '❤️'
      })
    });

    console.log(`反应请求状态码: ${addReactionResponse.status}`);
    
    if (addReactionResponse.ok) {
      const reactionData = await addReactionResponse.json();
      console.log('✅ 添加反应成功:', reactionData);
    } else {
      const errorData = await addReactionResponse.json();
      console.log('❌ 添加反应失败:', errorData);
      
      // 输出详细的错误信息
      console.log('响应头:', Object.fromEntries(addReactionResponse.headers.entries()));
      console.log('状态码:', addReactionResponse.status);
    }

    // 4. 获取留言的所有反应
    console.log('\n4. 获取留言反应...');
    const getReactionsResponse = await fetch(`${BASE_URL}/api/messages/${firstMessage.id}/reactions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (getReactionsResponse.ok) {
      const reactionsData = await getReactionsResponse.json();
      console.log('✅ 获取反应成功:', reactionsData);
    } else {
      const errorData = await getReactionsResponse.json();
      console.log('❌ 获取反应失败:', errorData);
    }

    // 5. 再次添加相同的emoji（应该移除）
    console.log('\n5. 再次添加相同emoji（测试移除功能）...');
    const removeReactionResponse = await fetch(`${BASE_URL}/api/messages/${firstMessage.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emoji: '❤️'
      })
    });

    if (removeReactionResponse.ok) {
      const removeData = await removeReactionResponse.json();
      console.log('✅ 移除反应成功:', removeData);
    } else {
      const errorData = await removeReactionResponse.json();
      console.log('❌ 移除反应失败:', errorData);
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

testEmojiReactions();