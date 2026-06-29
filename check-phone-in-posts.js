require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPhoneNumbers() {
  try {
    console.log('🔍 Checking phone numbers in posts...\n');

    // Get posts with user info
    const posts = await prisma.post.findMany({
      where: {
        type: {
          in: ['GAME_ACCOUNT', 'MARKETPLACE_LISTING']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${posts.length} marketplace posts\n`);

    let withPhone = 0;
    let withoutPhone = 0;

    posts.forEach((post, index) => {
      const hasPhone = !!post.user.phone;
      if (hasPhone) withPhone++;
      else withoutPhone++;

      console.log(`${index + 1}. ${post.user.username} (${post.user.firstName} ${post.user.lastName})`);
      console.log(`   Post: ${post.title?.substring(0, 50)}...`);
      console.log(`   Phone: ${hasPhone ? '✅ ' + post.user.phone : '❌ No phone number'}`);
      console.log(`   Game: ${post.gameTitle || 'N/A'}`);
      console.log('');
    });

    console.log('📈 Summary:');
    console.log(`   With Phone: ${withPhone}`);
    console.log(`   Without Phone: ${withoutPhone}`);
    console.log(`   Total: ${posts.length}`);

    // Check a specific user if needed
    console.log('\n🔍 Checking users with phone numbers...');
    const usersWithPhone = await prisma.user.findMany({
      where: {
        phone: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        phone: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      take: 10
    });

    console.log(`\n📱 Found ${usersWithPhone.length} users with phone numbers:\n`);
    usersWithPhone.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.phone}`);
      console.log(`   Posts: ${user._count.posts}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhoneNumbers();
