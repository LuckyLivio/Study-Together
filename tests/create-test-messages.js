// 创建测试留言的脚本
// 使用Node.js 18+内置的fetch API

const BASE_URL = 'http://localhost:3000';

async function createTestMessages() {
  try {
    console.log('=== 创建测试留言 ===\n');

    // 1. 用户1登录
    console.log('1. 用户1登录...');
    const loginResponse1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser1',
        password: 'password123'
      })
    });

    const loginData1 = await loginResponse1.json();
    if (!loginResponse1.ok) {
      throw new Error(`用户1登录失败: ${loginData1.error}`);
    }

    const token1 = loginData1.token;
    console.log('✅ 用户1登录成功');

    // 2. 用户2登录
    console.log('\n2. 用户2登录...');
    const loginResponse2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser2',
        password: 'password123'
      })
    });

    const loginData2 = await loginResponse2.json();
    if (!loginResponse2.ok) {
      throw new Error(`用户2登录失败: ${loginData2.error}`);
    }

    const token2 = loginData2.token;
    console.log('✅ 用户2登录成功');

    // 3. 创建测试留言
    const testMessages = [
      {
        content: '今天天气真好！☀️',
        visibility: 'PUBLIC',
        token: token1,
        user: 'testuser1'
      },
      {
        content: '我爱你 ❤️',
        visibility: 'PRIVATE',
        receiverId: 'testuser2',
        token: token1,
        user: 'testuser1'
      },
      {
        content: '一起去看电影吧！🎬',
        visibility: 'PUBLIC',
        token: token2,
        user: 'testuser2'
      },
      {
        content: '想你了 💕',
        visibility: 'PRIVATE',
        receiverId: 'testuser1',
        token: token2,
        user: 'testuser2'
      },
      {
        content: '今天学习了很多新知识！📚',
        visibility: 'PUBLIC',
        token: token1,
        user: 'testuser1'
      }
    ];

    console.log('\n3. 创建测试留言...');
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      const messageData = {
        content: message.content,
        visibility: message.visibility,
        attachments: []
      };
      
      if (message.receiverId) {
        messageData.receiverId = message.receiverId;
      }
      
      const response = await fetch(`${BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${message.token}`
        },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 留言 ${i + 1} 创建成功 (${message.user}): ${message.content}`);
      } else {
        const error = await response.json();
        console.log(`❌ 留言 ${i + 1} 创建失败 (${message.user}): ${error.error}`);
      }
      
      // 添加小延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ 测试留言创建完成！');
    console.log('现在可以在浏览器中访问 http://localhost:3000/messages 查看留言墙');

  } catch (error) {
    console.error('创建测试留言时发生错误:', error.message);
  }
}

createTestMessages();