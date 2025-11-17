// Run this on Render to verify abonejoseph@gmail.com
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
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const badge = await prisma.verificationBadge.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        purchasedAt: new Date(),
        expiresAt
      },
      update: {
        status: 'active',
        purchasedAt: new Date(),
        expiresAt
      }
    });
    
    console.log('✅ User verified:', user.email);
    console.log('✅ Badge expires:', badge.expiresAt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
