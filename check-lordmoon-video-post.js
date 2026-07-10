require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVideoPosts() {
  try {
    console.log('🔍 Checking LORDMOON video posts...\n');

    // Find LORDMOON user
    const lordmoonUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: 'LORDMOON', mode: 'insensitive' } },
          { firstName: { contains: 'LORDMOON', mode: 'insensitive' } }
        ]
      }
    });

    if (!lordmoonUser) {
      console.log('❌ LORDMOON user not found');
      return;
    }

    console.log(`✅ Found user: ${lordmoonUser.username} (${lordmoonUser.firstName})`);
    console.log(`   User ID: ${lordmoonUser.id}\n`);

    // Get their social posts with videos
    const posts = await prisma.post.findMany({
      where: {
        userId: lordmoonUser.id,
        type: 'SOCIAL_POST',
        videos: {
          isEmpty: false
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📹 Found ${posts.length} video posts:\n`);

    posts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post.id}`);
      console.log(`   Description: ${post.description?.substring(0, 50)}...`);
      console.log(`   Videos: ${post.videos}`);
      console.log(`   Video URLs:`);
      if (Array.isArray(post.videos)) {
        post.videos.forEach((url, i) => {
          console.log(`     ${i + 1}. ${url}`);
        });
      } else {
        console.log(`     Raw: ${JSON.stringify(post.videos)}`);
      }
      console.log(`   Created: ${post.createdAt}`);
      console.log('');
    });

    // Check if videos are accessible
    if (posts.length > 0 && posts[0].videos && Array.isArray(posts[0].videos) && posts[0].videos[0]) {
      console.log('🔗 Testing first video URL accessibility...');
      const videoUrl = posts[0].videos[0];
      console.log(`   URL: ${videoUrl}`);
      
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(videoUrl, { method: 'HEAD' });
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideoPosts();
