const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enableKYC() {
  try {
    // Get email from command line argument or use default
    const email = process.argv[2] || 'abonejoseph@gmail.com';
    
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      console.log('📋 Listing all users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, username: true, isKYCVerified: true }
      });
      console.table(allUsers);
      console.log('\n💡 Usage: node enable-kyc.js <email>');
      return;
    }
    
    const result = await prisma.user.update({
      where: {
        email
      },
      data: {
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    console.log('✅ KYC and email verification enabled for:', result.email);
    console.log('User ID:', result.id);
    console.log('Username:', result.username);
    console.log('KYC Verified:', result.isKYCVerified);
    console.log('Email Verified:', result.isEmailVerified);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enableKYC();
