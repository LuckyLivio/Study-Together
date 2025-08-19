const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function cleanupSecuritySettings() {
  console.log('🧹 清理安全设置数据库...');
  
  try {
    // 查询所有安全设置记录
    const allSettings = await prisma.securitySettings.findMany();
    console.log(`\n找到 ${allSettings.length} 条安全设置记录`);
    
    // 找到非default的记录
    const nonDefaultSettings = allSettings.filter(s => s.id !== 'default');
    console.log(`\n需要删除 ${nonDefaultSettings.length} 条非default记录`);
    
    if (nonDefaultSettings.length > 0) {
      // 删除非default记录
      for (const setting of nonDefaultSettings) {
        console.log(`删除记录: ${setting.id}`);
        await prisma.securitySettings.delete({
          where: { id: setting.id }
        });
      }
      console.log('✅ 清理完成');
    } else {
      console.log('✅ 数据库已经是干净的');
    }
    
    // 验证最终状态
    const finalSettings = await prisma.securitySettings.findMany();
    console.log(`\n最终状态: ${finalSettings.length} 条记录`);
    
    if (finalSettings.length === 1 && finalSettings[0].id === 'default') {
      console.log('✅ 数据库状态正常');
      console.log('当前设置:');
      console.log(JSON.stringify(finalSettings[0], null, 2));
    } else {
      console.log('❌ 数据库状态异常');
    }
    
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSecuritySettings();