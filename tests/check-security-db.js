const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkSecuritySettings() {
  console.log('🔍 检查数据库中的安全设置...');
  
  try {
    // 查询所有安全设置记录
    const settings = await prisma.securitySettings.findMany();
    console.log('\n数据库中的安全设置记录:');
    console.log(JSON.stringify(settings, null, 2));
    
    if (settings.length === 0) {
      console.log('\n❌ 数据库中没有安全设置记录');
      
      // 创建默认设置
      console.log('\n创建默认安全设置...');
      const defaultSettings = await prisma.securitySettings.create({
        data: {
          id: 'default'
        }
      });
      console.log('✅ 默认安全设置已创建:');
      console.log(JSON.stringify(defaultSettings, null, 2));
    } else {
      console.log(`\n✅ 找到 ${settings.length} 条安全设置记录`);
    }
    
    // 测试更新操作
    console.log('\n🔄 测试更新操作...');
    const updated = await prisma.securitySettings.upsert({
      where: { id: 'default' },
      update: {
        maxLoginAttempts: 7,
        lockoutDuration: 25
      },
      create: {
        id: 'default',
        maxLoginAttempts: 7,
        lockoutDuration: 25
      }
    });
    
    console.log('✅ 更新后的设置:');
    console.log(JSON.stringify(updated, null, 2));
    
    // 验证更新
    const verified = await prisma.securitySettings.findFirst({
      where: { id: 'default' }
    });
    
    console.log('\n🔍 验证更新结果:');
    console.log(JSON.stringify(verified, null, 2));
    
    if (verified.maxLoginAttempts === 7 && verified.lockoutDuration === 25) {
      console.log('\n✅ 数据库更新成功');
    } else {
      console.log('\n❌ 数据库更新失败');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSecuritySettings();