const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    console.log('所有文件夹:');
    folders.forEach(folder => {
      console.log(`ID: ${folder.id}, 名称: ${folder.name}, 描述: ${folder.description || 'N/A'}, 颜色: ${folder.color || 'N/A'}, 用户: ${folder.user.username}, 创建时间: ${folder.createdAt}`);
    });
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
})();