const { PrismaClient } = require('./src/generated/prisma');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testUser() {
  try {
    const user = await prisma.user.findFirst();
    console.log('First user:', user);
    
    if (user) {
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Generated token:', token);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUser();