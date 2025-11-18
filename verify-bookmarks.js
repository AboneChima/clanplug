const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyBookmarks() {
  try {
    console.log('🔍 Checking if Bookmark table exists...');
    
    // Try to query bookmarks
    const bookmarkCount = await prisma.bookmark.count();
    console.log(`✅ Bookmark table exists! Found ${bookmarkCount} bookmarks.`);
    
    // Test creating a bookmark (will fail if table doesn't exist)
    console.log('\n📝 Testing bookmark creation...');
    
    // Get a test user and post
    const user = await prisma.user.findFirst();
    const post = await prisma.post.findFirst();
    
    if (user && post) {
      // Check if bookmark already exists
      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });
      
      if (existing) {
        console.log('✅ Test bookmark already exists');
      } else {
        const testBookmark = await prisma.bookmark.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });
        console.log('✅ Successfully created test bookmark:', testBookmark.id);
        
        // Clean up test bookmark
        await prisma.bookmark.delete({
          where: { id: testBookmark.id },
        });
        console.log('✅ Cleaned up test bookmark');
      }
    }
    
    console.log('\n✅ Bookmark functionality is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P2021') {
      console.log('\n⚠️  The Bookmark table does not exist in the database.');
      console.log('📋 You need to run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyBookmarks();
