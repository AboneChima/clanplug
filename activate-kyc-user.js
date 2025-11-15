// Run this script on Render to verify a user
// Usage: node activate-kyc-user.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = 'Franklynnnamdi136@gmail.com';

async function activateKYC() {
  try {
    console.log(`🔍 Searching for user with email: ${EMAIL}`);
    
    const user = await prisma.user.findUnique({
      where: { email: EMAIL }
    });

    if (!user) {
      console.log(`❌ User not found with email: ${EMAIL}`);
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found:');
    console.log({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isKYCVerified: user.isKYCVerified,
      status: user.status
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

    console.log('✅ User verified successfully!');
    console.log({
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

activateKYC();
