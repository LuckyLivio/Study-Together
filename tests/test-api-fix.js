const { PrismaClient } = require('./src/generated/prisma');

async function testAPIs() {
  console.log('🔧 测试API修复...');
  
  try {
    // 测试Prisma连接
    console.log('\n📊 测试数据库连接...');
    const prisma = new PrismaClient();
    
    // 测试查询
    const testQuery = await prisma.siteSettings.findMany({
      take: 1
    });
    console.log('✅ 数据库连接成功');
    console.log('📋 现有设置记录数:', testQuery.length);
    
    // 测试维护模式API数据
    console.log('\n🔧 测试维护模式设置...');
    const maintenanceSettings = await prisma.siteSettings.findFirst({
      where: { key: 'maintenance' }
    });
    
    if (maintenanceSettings) {
      console.log('✅ 维护模式设置存在');
      console.log('📄 设置内容:', JSON.parse(maintenanceSettings.value));
    } else {
      console.log('⚠️  维护模式设置不存在，将创建默认设置');
      await prisma.siteSettings.create({
        data: {
          key: 'maintenance',
          value: JSON.stringify({
            enabled: false,
            message: '网站正在维护中，请稍后访问'
          })
        }
      });
      console.log('✅ 默认维护模式设置已创建');
    }
    
    // 测试网站设置API数据
    console.log('\n🌐 测试网站设置...');
    const siteSettings = await prisma.siteSettings.findFirst({
      where: { key: 'site_config' }
    });
    
    if (siteSettings) {
      console.log('✅ 网站设置存在');
      console.log('📄 设置内容:', JSON.parse(siteSettings.value));
    } else {
      console.log('⚠️  网站设置不存在，将创建默认设置');
      await prisma.siteSettings.create({
        data: {
          key: 'site_config',
          value: JSON.stringify({
            siteName: 'Study Together',
            siteDescription: '情侣共同学习平台',
            siteUrl: 'https://study-together.com',
            logoUrl: '',
            faviconUrl: '',
            contactEmail: 'admin@study-together.com',
            contactPhone: '',
            address: '',
            socialLinks: {
              github: '',
              twitter: '',
              instagram: '',
              wechat: ''
            },
            seo: {
              keywords: '学习,情侣,共同进步,任务管理',
              author: 'Study Together Team',
              ogImage: ''
            },
            analytics: {
              googleAnalyticsId: '',
              baiduAnalyticsId: ''
            }
          })
        }
      });
      console.log('✅ 默认网站设置已创建');
    }
    
    await prisma.$disconnect();
    
    console.log('\n🎉 API修复测试完成！');
    console.log('💡 现在可以在Trae预览中测试网站设置保存功能');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('🔍 详细错误:', error);
  }
}

testAPIs().catch(console.error);