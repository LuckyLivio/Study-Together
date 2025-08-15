// 测试IP地址修复的脚本
const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function testIPFix() {
  try {
    console.log('正在查询最近的登录记录...')
    
    // 获取最近的登录记录
    const loginAttempts = await prisma.loginAttempt.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        timestamp: true,
        success: true,
        reason: true,
        username: true
      }
    })
    
    console.log('\n最近的登录记录:')
    console.log('==================')
    
    if (loginAttempts.length === 0) {
      console.log('暂无登录记录')
    } else {
      loginAttempts.forEach((attempt, index) => {
        console.log(`${index + 1}. IP: ${attempt.ip}`)
        console.log(`   用户: ${attempt.username || '未知'}`)
        console.log(`   状态: ${attempt.success ? '成功' : '失败'}`)
        console.log(`   时间: ${attempt.timestamp.toLocaleString('zh-CN')}`)
        if (attempt.reason) {
          console.log(`   原因: ${attempt.reason}`)
        }
        console.log('---')
      })
    }
    
    // 检查是否还有::1的记录
    const ipv6Records = await prisma.loginAttempt.count({
      where: {
        ip: '::1'
      }
    })
    
    console.log(`\n数据库中仍有 ${ipv6Records} 条显示为 '::1' 的记录`)
    
    if (ipv6Records > 0) {
      console.log('建议：这些是历史记录，新的登录记录应该显示为 "本地访问 (localhost)"')
    }
    
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testIPFix()