const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'Franklynnnamdi136@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found with email: Franklynnnamdi136@gmail.com');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isKYCVerified: user.isKYCVerified
    });

    // Update user to verified
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        status: 'ACTIVE'
      }
    });

    console.log('✅ User verified successfully!');
    console.log('Updated user:', {
      id: updated.id,
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
