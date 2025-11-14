const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon'
    }
  }
});

async function createTestPost() {
  const email = 'abonejoseph@gmail.com';
  
  try {
    console.log('🔍 Finding user:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('');
    
    // Activate KYC first
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    console.log('✅ KYC activated');
    console.log('');
    
    // Create test posts
    const posts = [
      {
        title: 'Welcome to Lordmoon!',
        description: 'Just joined this amazing platform! Excited to connect with everyone here. 🎮',
        type: 'SOCIAL_POST'
      },
      {
        title: 'Gaming Setup',
        description: 'Check out my new gaming setup! Ready for some epic battles. Who wants to team up? 💪🎯',
        type: 'SOCIAL_POST'
      },
      {
        title: 'Looking for Squad',
        description: 'Anyone up for some ranked matches tonight? Drop your username below! 🔥',
        type: 'SOCIAL_POST'
      }
    ];
    
    console.log('📝 Creating test posts...');
    
    for (const postData of posts) {
      const post = await prisma.post.create({
        data: {
          ...postData,
          userId: user.id
        }
      });
      console.log('  ✅ Created:', post.title);
    }
    
    console.log('');
    console.log('✅ All done!');
    console.log('User:', user.email);
    console.log('Username:', user.username);
    console.log('Posts created: 3');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPost();
