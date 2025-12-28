const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVerifications() {
  try {
    console.log('\n=== VERIFICATION BADGES STATUS ===\n');
    
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

    console.log(`Total badges: ${badges.length}\n`);

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
          timeRemaining = `EXPIRED (${Math.abs(daysRemaining)} days ago)`;
        }
      }

      console.log(`${index + 1}. ${badge.user.username} (${badge.user.email})`);
      console.log(`   Name: ${badge.user.firstName} ${badge.user.lastName}`);
      console.log(`   Status: ${badge.status}`);
      console.log(`   Purchased: ${badge.purchasedAt?.toLocaleDateString()}`);
      console.log(`   Expires: ${expiresAt ? expiresAt.toLocaleDateString() : 'Never'}`);
      console.log(`   Time Remaining: ${timeRemaining}`);
      console.log('');
    });

    // Summary
    const active = badges.filter(b => {
      if (!b.expiresAt) return false;
      return new Date(b.expiresAt) > new Date();
    });
    
    const expired = badges.filter(b => {
      if (!b.expiresAt) return false;
      return new Date(b.expiresAt) <= new Date();
    });

    const byStatus = badges.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    console.log('=== SUMMARY ===');
    console.log(`Total: ${badges.length}`);
    console.log(`Active (not expired): ${active.length}`);
    console.log(`Expired: ${expired.length}`);
    console.log('\nBy Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVerifications();
