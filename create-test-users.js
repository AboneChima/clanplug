const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'sarah.johnson@example.com',
    username: 'sarahjay',
    firstName: 'Sarah',
    lastName: 'Johnson',
    password: 'Test123!',
    bio: 'Digital creator & photographer 📸 | Travel enthusiast ✈️',
    city: 'Los Angeles',
    state: 'California',
    country: 'USA'
  },
  {
    email: 'mike.chen@example.com',
    username: 'mikechen',
    firstName: 'Mike',
    lastName: 'Chen',
    password: 'Test123!',
    bio: 'Tech entrepreneur | Building the future 🚀',
    city: 'San Francisco',
    state: 'California',
    country: 'USA'
  },
  {
    email: 'emma.williams@example.com',
    username: 'emmawill',
    firstName: 'Emma',
    lastName: 'Williams',
    password: 'Test123!',
    bio: 'Fashion designer | Style is a way to say who you are 👗',
    city: 'New York',
    state: 'New York',
    country: 'USA'
  },
  {
    email: 'david.brown@example.com',
    username: 'davidbrown',
    firstName: 'David',
    lastName: 'Brown',
    password: 'Test123!',
    bio: 'Fitness coach | Helping you reach your goals 💪',
    city: 'Miami',
    state: 'Florida',
    country: 'USA'
  },
  {
    email: 'lisa.martinez@example.com',
    username: 'lisamartinez',
    firstName: 'Lisa',
    lastName: 'Martinez',
    password: 'Test123!',
    bio: 'Food blogger | Sharing delicious recipes 🍕',
    city: 'Chicago',
    state: 'Illinois',
    country: 'USA'
  },
  {
    email: 'james.wilson@example.com',
    username: 'jameswilson',
    firstName: 'James',
    lastName: 'Wilson',
    password: 'Test123!',
    bio: 'Music producer | Creating beats that move you 🎵',
    city: 'Nashville',
    state: 'Tennessee',
    country: 'USA'
  },
  {
    email: 'sophia.garcia@example.com',
    username: 'sophiagarcia',
    firstName: 'Sophia',
    lastName: 'Garcia',
    password: 'Test123!',
    bio: 'Artist & illustrator | Bringing imagination to life 🎨',
    city: 'Austin',
    state: 'Texas',
    country: 'USA'
  },
  {
    email: 'alex.taylor@example.com',
    username: 'alextaylor',
    firstName: 'Alex',
    lastName: 'Taylor',
    password: 'Test123!',
    bio: 'Software engineer | Code, coffee, repeat ☕',
    city: 'Seattle',
    state: 'Washington',
    country: 'USA'
  }
];

const samplePosts = [
  "Just finished an amazing workout session! Feeling energized 💪 #fitness #motivation",
  "Exploring the city today. The architecture here is stunning! 🏙️",
  "New recipe alert! Just made the best pasta dish ever 🍝",
  "Working on some exciting new projects. Can't wait to share! 🚀",
  "Beautiful sunset today. Nature never disappoints 🌅",
  "Coffee and coding - the perfect combination ☕💻",
  "Just launched my new collection! Check it out 👗✨",
  "Music is the universal language. What's your favorite song? 🎵",
  "Travel tip: Always try the local cuisine! 🌍",
  "Grateful for all the support from this amazing community ❤️"
];

async function createTestUsers() {
  try {
    console.log('🚀 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          passwordHash: hashedPassword,
          bio: userData.bio,
          city: userData.city,
          state: userData.state,
          country: userData.country,
          referralCode: `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          isEmailVerified: true,
          isKYCVerified: true,
        }
      });

      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (@${user.username})`);

      // Create 2-3 posts for each user
      const numPosts = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numPosts; i++) {
        const randomPost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
        await prisma.post.create({
          data: {
            title: `Post by ${user.firstName}`,
            description: randomPost,
            userId: user.id,
            type: 'SOCIAL_POST',
          }
        });
      }

      console.log(`   📝 Created ${numPosts} posts for ${user.firstName}\n`);
    }

    console.log('\n✨ All test users created successfully!');
    console.log('\n📋 Login credentials for all users:');
    console.log('   Password: Test123!\n');
    
    testUsers.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName}: ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
