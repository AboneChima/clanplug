require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteBotFollowers() {
  try {
    console.log('🔍 Finding bot followers...');

    // Find all users with "bot" in their username or email
    const botUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'bot', mode: 'insensitive' } },
          { email: { contains: 'bot', mode: 'insensitive' } },
          { firstName: { contains: 'bot', mode: 'insensitive' } },
          { lastName: { contains: 'bot', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`Found ${botUsers.length} bot users:`, botUsers);

    if (botUsers.length === 0) {
      console.log('✅ No bot users found');
      return;
    }

    const botUserIds = botUsers.map(u => u.id);

    // Delete all follow relationships involving bot users
    const deleteFollows = await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: botUserIds } },
          { followingId: { in: botUserIds } }
        ]
      }
    });

    console.log(`🗑️ Deleted ${deleteFollows.count} follow relationships`);

    // Optionally delete the bot users themselves
    const deleteUsers = await prisma.user.deleteMany({
      where: {
        id: { in: botUserIds }
      }
    });

    console.log(`🗑️ Deleted ${deleteUsers.count} bot users`);
    console.log('✅ Bot followers cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteBotFollowers();
