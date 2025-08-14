const { PrismaClient } = require('./src/generated/prisma');
require('dotenv').config();

// 测试数据库URL格式验证
async function testDatabaseUrlValidation() {
  console.log('\n=== 测试数据库URL格式验证 ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    // 检查URL格式
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.log('❌ DATABASE_URL 未设置');
      return;
    }
    
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      console.log('❌ URL格式错误: URL必须以 postgresql:// 或 postgres:// 开头');
      console.log('当前URL:', url);
      return;
    }
    
    console.log('✅ URL格式正确');
    
    // 尝试连接
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    if (error.message.includes('protocol')) {
      console.log('这是协议格式错误');
    }
  }
}

// 测试DeepSeek API Key字符编码
async function testDeepSeekKeyEncoding() {
  console.log('\n=== 测试DeepSeek API Key字符编码 ===');
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log('DEEPSEEK_API_KEY:', apiKey);
  
  if (!apiKey) {
    console.log('❌ DEEPSEEK_API_KEY 未设置');
    return;
  }
  
  // 检查字符编码
  console.log('API Key长度:', apiKey.length);
  
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey[i];
    const charCode = char.charCodeAt(0);
    if (charCode > 255) {
      console.log(`❌ 字符编码错误: 位置 ${i} 的字符 '${char}' 编码值为 ${charCode} (大于255)`);
      return;
    }
  }
  
  console.log('✅ 所有字符编码都在有效范围内');
  
  // 测试ByteString转换
  try {
    const buffer = Buffer.from(apiKey, 'utf8');
    console.log('✅ Buffer转换成功');
    
    // 测试API调用
    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: 'Test'
        }],
        max_tokens: 5
      })
    });
    
    console.log('API响应状态:', response.status);
    if (response.ok) {
      console.log('✅ DeepSeek API调用成功');
    } else {
      const errorText = await response.text();
      console.log('❌ API调用失败:', errorText);
    }
    
  } catch (error) {
    console.log('❌ ByteString转换或API调用失败:', error.message);
    if (error.message.includes('ByteString')) {
      console.log('这是字符编码问题');
    }
  }
}

// 主函数
async function main() {
  console.log('开始重现用户报告的错误...');
  
  await testDatabaseUrlValidation();
  await testDeepSeekKeyEncoding();
  
  console.log('\n测试完成');
}

main().catch(console.error);