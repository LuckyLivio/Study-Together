// 最终连接测试脚本 - 验证修复后的连接状态
const { PrismaClient } = require('./src/generated/prisma')
require('dotenv').config()

async function testFinalConnections() {
  console.log('🔍 开始最终连接测试...')
  console.log('=' .repeat(50))
  
  // 1. 测试数据库连接
  console.log('\n📊 测试数据库连接...')
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ 数据库连接成功:', result)
    await prisma.$disconnect()
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message)
  }
  
  // 2. 测试 DeepSeek API 连接
  console.log('\n🤖 测试 DeepSeek API 连接...')
  try {
    const response = await fetch(process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ DeepSeek API 连接成功, 状态码:', response.status)
    } else {
      console.log('❌ DeepSeek API 连接失败, 状态码:', response.status)
    }
  } catch (error) {
    console.log('❌ DeepSeek API 连接失败:', error.message)
  }
  
  // 3. 验证环境变量配置
  console.log('\n⚙️  验证环境变量配置...')
  const envVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'JWT_SECRET': process.env.JWT_SECRET,
    'DEEPSEEK_API_KEY': process.env.DEEPSEEK_API_KEY,
    'DEEPSEEK_API_URL': process.env.DEEPSEEK_API_URL,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
  }
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`✅ ${key}: 已配置`)
    } else {
      console.log(`❌ ${key}: 未配置`)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('🎉 最终连接测试完成！')
}

testFinalConnections().catch(console.error)