const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function activateKYC() {
  try {
    console.log('🔍 Looking for user: abonejoseph@gmail.com / Deoracle...');
    
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'abonejoseph@gmail.com' },
          { username: 'Deoracle' }
        ]
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, username: true, isKYCVerified: true }
      });
      console.table(allUsers);
      return;
    }

    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      username: user.username,
      currentKYC: user.isKYCVerified
    });

    if (user.isKYCVerified) {
      console.log('✅ User already has KYC verified!');
      return;
    }

    // Activate KYC
    console.log('🔄 Activating KYC...');
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        status: 'ACTIVE'
      }
    });

    console.log('✅ KYC ACTIVATED!');
    console.log('Updated user:', {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      isKYCVerified: updated.isKYCVerified,
      status: updated.status
    });

    console.log('\n🎉 SUCCESS! User can now:');
    console.log('  ✅ Create marketplace listings');
    console.log('  ✅ Like posts');
    console.log('  ✅ Follow users');
    console.log('  ✅ Comment on posts');
    console.log('  ✅ All features unlocked!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateKYC();
