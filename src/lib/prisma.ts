import { PrismaClient } from '@/generated/prisma';

// 全局Prisma实例，避免在开发环境中创建过多连接
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}