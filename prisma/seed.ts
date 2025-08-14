import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建测试用户
  const users = [
    {
      username: 'admin',
      email: 'admin@studytogether.com',
      displayName: '管理员',
      password: 'admin123',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      gender: 'OTHER' as const,
      isAdmin: true,
    },
    {
      username: 'user1',
      email: 'user1@example.com',
      displayName: '用户一',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'MALE' as const,
    },
    {
      username: 'user2',
      email: 'user2@example.com',
      displayName: '用户二',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'FEMALE' as const,
    },
    {
      username: 'moderator',
      email: 'mod@example.com',
      displayName: '版主',
      password: 'mod123',
      role: 'MODERATOR' as const,
      status: 'ACTIVE' as const,
      gender: 'OTHER' as const,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username }
    });
    
    if (!existingUser) {
      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      console.log(`Created user: ${userData.username}`);
    } else {
      console.log(`User already exists: ${userData.username}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });