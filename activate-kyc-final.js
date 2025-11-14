const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a/lordmoon'
    }
  }
});

async function activateKYC() {
  const email = 'abonejoseph@gmail.com';
  
  try {
    console.log('🔍 Finding user:', email);
    
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
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('Current KYC:', user.isKYCVerified ? '✅' : '❌');
    console.log('');
    
    if (user.isKYCVerified) {
      console.log('ℹ️  KYC already activated!');
      return;
    }
    
    const updated = await prisma.user.update({
      where: { email },
      data: {
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    console.log('✅ KYC ACTIVATED!');
    console.log('User:', updated.email);
    console.log('Username:', updated.username);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

activateKYC();
