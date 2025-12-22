const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    const emails = [
      'Franklynnnamdi136@gmail.com',
      'abonejoseph@gmail.com'
    ];

    // Calculate expiry date (5 years from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    console.log('🔍 Verifying users for 5 years...');
    console.log('Expiry Date:', expiresAt.toISOString());

    for (const email of emails) {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      // Check if badge already exists
      let badge = await prisma.verificationBadge.findUnique({
        where: { userId: user.id }
      });

      if (badge) {
        // Update existing badge
        badge = await prisma.verificationBadge.update({
          where: { userId: user.id },
          data: {
            status: 'active',
            purchasedAt: new Date(),
            expiresAt: expiresAt
          }
        });
        console.log(`✅ Updated verification badge for: ${email}`);
      } else {
        // Create new badge
        badge = await prisma.verificationBadge.create({
          data: {
            userId: user.id,
            status: 'active',
            purchasedAt: new Date(),
            expiresAt: expiresAt
          }
        });
        console.log(`✅ Created verification badge for: ${email}`);
      }

      console.log(`   User: ${user.firstName} ${user.lastName} (@${user.username})`);
      console.log(`   Badge ID: ${badge.id}`);
      console.log(`   Expires: ${badge.expiresAt?.toISOString()}`);
      console.log('');
    }

    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers();
