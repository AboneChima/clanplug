const { PrismaClient } = require('@prisma/client');

// This connects to the Render backend database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.htfnwvaqrhzcoybphiqk:Abonechima10.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres'
    }
  }
});

async function activateKYC() {
  const email = 'abonejoseph@gmail.com';
  
  try {
    console.log('🔍 Connecting to Render database...');
    console.log('');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found:', email);
      console.log('');
      console.log('Please verify:');
      console.log('1. User has signed up at: https://web-41tami87f-oracles-projects-0d30db20.vercel.app');
      console.log('2. The email is correct');
      return;
    }
    
    console.log('✅ User found!');
    console.log('');
    console.log('Current Status:');
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  KYC Verified:', user.isKYCVerified ? '✅' : '❌');
    console.log('  Email Verified:', user.isEmailVerified ? '✅' : '❌');
    console.log('');
    
    if (user.isKYCVerified && user.isEmailVerified) {
      console.log('ℹ️  User already has KYC and email verified!');
      return;
    }
    
    // Update the user
    const updated = await prisma.user.update({
      where: { email },
      data: {
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    console.log('✅ KYC ACTIVATED SUCCESSFULLY!');
    console.log('');
    console.log('Updated Status:');
    console.log('  KYC Verified: ✅');
    console.log('  Email Verified: ✅');
    console.log('');
    console.log('User can now access all features!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.code === 'P2025') {
      console.error('User not found in database');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

activateKYC();
