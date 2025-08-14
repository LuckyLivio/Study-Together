const { PrismaClient } = require('./src/generated/prisma');
require('dotenv').config();

// 测试数据库连接
async function testDatabase() {
  console.log('\n=== 测试数据库连接 ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    const prisma = new PrismaClient();
    console.log('正在连接数据库...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 测试简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库查询测试成功:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    console.log('错误详情:', error);
  }
}

// 测试DeepSeek API
async function testDeepSeekAPI() {
  console.log('\n=== 测试DeepSeek API ===');
  console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY);
  console.log('DEEPSEEK_API_URL:', process.env.DEEPSEEK_API_URL);
  
  try {
    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: 'Hello, this is a test message.'
        }],
        max_tokens: 10
      })
    });
    
    console.log('API响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DeepSeek API连接成功');
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ DeepSeek API连接失败');
      console.log('错误响应:', errorText);
    }
  } catch (error) {
    console.log('❌ DeepSeek API连接失败:', error.message);
    console.log('错误详情:', error);
  }
}

// 主函数
async function main() {
  console.log('开始连接测试...');
  
  await testDatabase();
  await testDeepSeekAPI();
  
  console.log('\n测试完成');
}

main().catch(console.error);