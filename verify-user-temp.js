const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'abonejoseph@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const badge = await prisma.verificationBadge.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      update: {
        status: 'active',
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('✅ User verified:', user.email);
    console.log('Badge expires:', badge.expiresAt);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
