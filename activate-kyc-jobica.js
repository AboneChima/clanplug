// This script activates KYC for Jobica user on Render database
// Run this with: node activate-kyc-jobica.js

const { PrismaClient } = require('@prisma/client');

// Use Render database URL directly
const DATABASE_URL = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a/lordmoon';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function activateKYC() {
  try {
    console.log('🔍 Looking for user: jobicafoods@gmail.com / Jobica...');
    
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'jobicafoods@gmail.com' },
          { username: 'Jobica' },
          { username: { contains: 'jobica', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('Searching for similar users...');
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'jobica', mode: 'insensitive' } },
            { username: { contains: 'jobica', mode: 'insensitive' } }
          ]
        },
        select: { id: true, email: true, username: true, isKYCVerified: true }
      });
      console.log('Found users:');
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

    console.log('\n🎉 SUCCESS! @Jobica can now:');
    console.log('  ✅ See verified badge next to their name');
    console.log('  ✅ Create marketplace listings');
    console.log('  ✅ Like posts');
    console.log('  ✅ Follow users');
    console.log('  ✅ Comment on posts');
    console.log('  ✅ All features unlocked!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

activateKYC();
