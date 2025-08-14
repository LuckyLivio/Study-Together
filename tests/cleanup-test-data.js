const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log('开始清理测试数据...');
    
    // 清除所有用户的coupleId
    const updateResult = await prisma.user.updateMany({
      data: {
        coupleId: null
      }
    });
    console.log(`已清除 ${updateResult.count} 个用户的情侣关联`);
    
    // 删除所有情侣记录
    const deleteResult = await prisma.couple.deleteMany({});
    console.log(`已删除 ${deleteResult.count} 个情侣记录`);
    
    console.log('测试数据清理完成！');
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();