// Check if users have phone numbers set
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkPhoneNumbers() {
  try {
    console.log('🔍 Checking user phone numbers...\n');
    
    // Get all users with their phone status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`📊 Checking ${users.length} most recent users:\n`);

    let usersWithPhone = 0;
    let usersWithoutPhone = 0;
    let usersWithPostsButNoPhone = 0;

    users.forEach((user, index) => {
      const hasPhone = !!user.phone;
      const hasPosts = user._count.posts > 0;

      if (hasPhone) {
        usersWithPhone++;
      } else {
        usersWithoutPhone++;
        if (hasPosts) {
          usersWithPostsButNoPhone++;
        }
      }

      const status = hasPhone ? '✅' : '❌';
      const phoneDisplay = hasPhone ? user.phone : 'NO PHONE';

      console.log(`${status} ${user.username}`);
      console.log(`   Phone: ${phoneDisplay}`);
      console.log(`   Posts: ${user._count.posts}`);
      console.log('');
    });

    console.log('\n📈 Summary:');
    console.log(`   ✅ Users with phone: ${usersWithPhone}`);
    console.log(`   ❌ Users without phone: ${usersWithoutPhone}`);
    console.log(`   ⚠️  Users with posts but no phone: ${usersWithPostsButNoPhone}`);

    if (usersWithPostsButNoPhone > 0) {
      console.log('\n⚠️  WARNING: Some users have created posts but have no phone number!');
      console.log('   These users need to add their phone number in Settings.');
      console.log('   Once they add it, the "Call Seller" button will show their number.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhoneNumbers();
