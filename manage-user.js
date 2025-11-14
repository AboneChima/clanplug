const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon'
    }
  }
});

async function manageUser() {
  const action = process.argv[2]; // 'kyc', 'post', 'info'
  const email = process.argv[3] || 'abonejoseph@gmail.com';
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }
    
    if (action === 'kyc') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isKYCVerified: true, isEmailVerified: true }
      });
      console.log('✅ KYC activated for:', user.username);
    } 
    else if (action === 'post') {
      const title = process.argv[4] || 'Test Post';
      const description = process.argv[5] || 'This is a test post';
      
      await prisma.post.create({
        data: {
          title,
          description,
          type: 'SOCIAL_POST',
          userId: user.id
        }
      });
      console.log('✅ Post created');
    }
    else {
      console.log('User Info:');
      console.log('  Email:', user.email);
      console.log('  Username:', user.username);
      console.log('  Name:', user.firstName, user.lastName);
      console.log('  KYC:', user.isKYCVerified ? '✅' : '❌');
      console.log('  Posts:', user.posts.length);
      console.log('');
      console.log('Recent Posts:');
      user.posts.forEach(p => console.log('  -', p.title));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage:
// node manage-user.js info email@example.com
// node manage-user.js kyc email@example.com
// node manage-user.js post email@example.com "Title" "Description"

manageUser();
