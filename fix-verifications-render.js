// Run this in Render backend shell: node fix-verifications-render.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVerifications() {
  try {
    console.log('🔧 Fixing all verification badges...\n');
    
    // 1. Update all 'active' to 'verified'
    const updated = await prisma.verificationBadge.updateMany({
      where: { status: 'active' },
      data: { status: 'verified' }
    });
    
    console.log(`✅ Updated ${updated.count} badges from 'active' to 'verified'\n`);
    
    // 2. Show all current verifications
    const badges = await prisma.verificationBadge.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total verified users: ${badges.length}\n`);
    console.log('=== VERIFIED USERS ===\n');

    badges.forEach((badge, index) => {
      const now = new Date();
      const expiresAt = badge.expiresAt ? new Date(badge.expiresAt) : null;
      
      let timeRemaining = 'No expiration';
      if (expiresAt) {
        const diff = expiresAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 365) {
          const years = Math.floor(daysRemaining / 365);
          timeRemaining = `${years} years (${daysRemaining} days)`;
        } else if (daysRemaining > 0) {
          timeRemaining = `${daysRemaining} days`;
        } else {
          timeRemaining = `EXPIRED`;
        }
      }

      console.log(`${index + 1}. ${badge.user.username}`);
      console.log(`   Email: ${badge.user.email}`);
      console.log(`   Status: ${badge.status}`);
      console.log(`   Expires: ${expiresAt ? expiresAt.toLocaleDateString() : 'Never'}`);
      console.log(`   Time Left: ${timeRemaining}\n`);
    });

    console.log('✅ All done! Badges are now using "verified" status.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVerifications();
