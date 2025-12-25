const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {
  try {
    const email = 'Natashanice8717@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // 60 days from now

    await prisma.verificationBadge.upsert({
      where: { userId: user.id },
      update: {
        status: 'verified',
        purchasedAt: new Date(),
        expiresAt: expiresAt
      },
      create: {
        userId: user.id,
        status: 'verified',
        purchasedAt: new Date(),
        expiresAt: expiresAt
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: '✅ Verification Badge Activated!',
        message: `Congratulations! Your verification badge is now active and will expire on ${expiresAt.toLocaleDateString()}.`
      }
    });

    console.log('✅ User verified successfully!');
    console.log('Email:', email);
    console.log('Username:', user.username);
    console.log('Expires:', expiresAt.toLocaleDateString());
    console.log('Duration: 60 days');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
