const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkLikesAndComments() {
  try {
    console.log('🔍 Checking database for likes and comments...\n');

    // Count total likes
    const likesCount = await prisma.like.count();
    console.log(`💙 Total Likes: ${likesCount}`);

    // Count total comments
    const commentsCount = await prisma.comment.count();
    console.log(`💬 Total Comments: ${commentsCount}`);

    // Get sample of posts with their counts
    const posts = await prisma.post.findMany({
      take: 10,
      where: {
        type: 'SOCIAL_POST',
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📊 Sample of recent posts:');
    posts.forEach((post, i) => {
      console.log(`\n${i + 1}. Post by @${post.user.username}`);
      console.log(`   Likes: ${post._count.likes}`);
      console.log(`   Comments: ${post._count.comments}`);
      console.log(`   Description: ${post.description?.substring(0, 50)}...`);
    });

    // Check if we have any likes at all
    if (likesCount > 0) {
      const sampleLikes = await prisma.like.findMany({
        take: 5,
        include: {
          user: { select: { username: true } },
          post: { select: { description: true } },
        },
      });
      console.log('\n💙 Sample Likes:');
      sampleLikes.forEach((like, i) => {
        console.log(`${i + 1}. @${like.user.username} liked: "${like.post.description?.substring(0, 30)}..."`);
      });
    }

    // Check if we have any comments at all
    if (commentsCount > 0) {
      const sampleComments = await prisma.comment.findMany({
        take: 5,
        include: {
          user: { select: { username: true } },
          post: { select: { description: true } },
        },
      });
      console.log('\n💬 Sample Comments:');
      sampleComments.forEach((comment, i) => {
        console.log(`${i + 1}. @${comment.user.username}: "${comment.content.substring(0, 50)}..."`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLikesAndComments();
