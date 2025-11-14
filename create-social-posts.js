const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com:5432/lordmoon?sslmode=require'
    }
  }
});

const socialPosts = [
  "Just hit level 50 in COD Mobile! Who wants to squad up? 🎮🔥",
  "Finally got that legendary skin I've been grinding for! 💎✨",
  "Anyone else think this new season is fire? 🔥",
  "Looking for teammates for ranked matches tonight! Drop your IGN below 👇",
  "That clutch moment when you're the last one standing... 😤💪",
  "New gaming setup complete! Ready to dominate 🖥️⚡",
  "Who's online right now? Let's run some games! 🎯",
  "Just pulled an all-nighter gaming and it was worth it 😅",
  "This community is amazing! Love connecting with fellow gamers ❤️🎮",
  "Drop your favorite game in the comments! Mine's definitely COD 🎮",
  "That feeling when you finally beat that impossible level 🙌",
  "Streaming later tonight! Who's joining? 📺🎮",
  "Just discovered this platform and I'm loving it already! 🚀",
  "Weekend gaming marathon starts now! Who's with me? 🎮☕",
  "Best gaming moment of the week right here! 🏆"
];

async function createSocialPosts() {
  try {
    console.log('🎮 Creating social posts for test users...\n');
    
    // Get all users except the main user
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: 'abonejoseph@gmail.com'
        }
      },
      take: 8
    });
    
    if (users.length === 0) {
      console.log('❌ No test users found');
      return;
    }
    
    console.log(`✅ Found ${users.length} users\n`);
    
    let totalPosts = 0;
    
    for (const user of users) {
      const numPosts = Math.floor(Math.random() * 3) + 2; // 2-4 posts per user
      
      for (let i = 0; i < numPosts; i++) {
        const randomPost = socialPosts[Math.floor(Math.random() * socialPosts.length)];
        
        await prisma.post.create({
          data: {
            title: randomPost.substring(0, 100),
            description: randomPost,
            type: 'SOCIAL_POST',
            userId: user.id
          }
        });
        
        totalPosts++;
      }
      
      console.log(`✅ Created ${numPosts} posts for ${user.firstName} ${user.lastName}`);
    }
    
    console.log(`\n🎉 Total posts created: ${totalPosts}`);
    console.log('\nNow refresh your feed to see posts from everyone!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSocialPosts();
