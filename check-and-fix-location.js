// Script to check and verify location data in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocationData() {
  try {
    console.log('🔍 Checking user location data...\n');
    
    // Get all users with their city field
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        city: true,
        state: true,
        country: true,
      },
      take: 10, // First 10 users
    });
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach(user => {
      console.log(`User: ${user.username}`);
      console.log(`  City: ${user.city || '(not set)'}`);
      console.log(`  State: ${user.state || '(not set)'}`);
      console.log(`  Country: ${user.country || '(not set)'}`);
      console.log('---');
    });
    
    // Test getting a specific user by ID (replace with actual ID)
    console.log('\n🧪 Testing getUserPublicById structure...\n');
    const firstUser = users[0];
    if (firstUser) {
      const userData = await prisma.user.findUnique({
        where: { id: firstUser.id },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          city: true,
          state: true,
          country: true,
          isKYCVerified: true,
        },
      });
      
      console.log('User data structure returned:');
      console.log(JSON.stringify(userData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocationData();
