const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection and checking tables...');
    const userCount = await prisma.user.count();
    console.log('✅ Connection and tables are active! Total Users:', userCount);
  } catch (err) {
    console.error('❌ Table check failed:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
