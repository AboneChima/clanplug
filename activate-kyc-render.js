// This script activates KYC for the user on Render database
// Run this with: node activate-kyc-render.js

const { PrismaClient } = require('@prisma/client');

// Use Render database URL directly
const DATABASE_URL = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ No database URL found!');
  console.log('Please set RENDER_DATABASE_URL environment variable');
  console.log('Or run this on Render where DATABASE_URL is set');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

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
      console.log('Searching for similar users...');
      const allUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'abone', mode: 'insensitive' } },
            { username: { contains: 'oracle', mode: 'insensitive' } }
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

    console.log('\n🎉 SUCCESS! User can now:');
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
