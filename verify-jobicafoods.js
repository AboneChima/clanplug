// Quick script to verify jobicafoods@gmail.com
// Run this on Render: node verify-jobicafoods.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {
  try {
    console.log('🔍 Searching for user: jobicafoods@gmail.com');
    
    const user = await prisma.user.findUnique({
      where: { email: 'jobicafoods@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      isKYCVerified: user.isKYCVerified
    });

    if (user.isKYCVerified) {
      console.log('ℹ️  User is already verified!');
      await prisma.$disconnect();
      return;
    }

    console.log('🔄 Verifying user...');
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        status: 'ACTIVE'
      }
    });

    console.log('✅ SUCCESS! User verified!');
    console.log({
      email: updated.email,
      username: updated.username,
      isKYCVerified: updated.isKYCVerified,
      status: updated.status
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
