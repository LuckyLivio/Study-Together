const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function clearCheckinRecords() {
  try {
    console.log('开始清理打卡记录...')
    
    // 删除所有标题为'每日打卡'的study_plans记录
    const result = await prisma.studyPlan.deleteMany({
      where: {
        title: '每日打卡'
      }
    })
    
    console.log(`成功删除 ${result.count} 条打卡记录`)
    
    // 验证删除结果
    const remaining = await prisma.studyPlan.count({
      where: {
        title: '每日打卡'
      }
    })
    
    console.log(`剩余打卡记录: ${remaining} 条`)
    
  } catch (error) {
    console.error('清理打卡记录失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearCheckinRecords()