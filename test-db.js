const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    const users = await prisma.user.findMany();
    console.log('Database connected successfully!');
    console.log('Number of users:', users.length);
    
    if (users.length === 0) {
      console.log('No users found. Creating test users...');
      
      const testUsers = [
        {
          email: 'admin@example.com',
          username: 'admin',
          displayName: 'Administrator',
          password: 'admin123',
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        {
          email: 'user@example.com',
          username: 'user',
          displayName: 'Test User',
          password: 'user123',
          role: 'USER',
          status: 'ACTIVE'
        }
      ];
      
      for (const userData of testUsers) {
        try {
          const user = await prisma.user.create({
            data: userData
          });
          console.log('Created user:', user.username);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log('User already exists:', userData.username);
          } else {
            console.error('Error creating user:', error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();