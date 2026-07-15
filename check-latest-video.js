const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestVideo() {
  const post = await prisma.post.findFirst({
    where: {
      videos: {
        isEmpty: false
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (post) {
    console.log('Latest video post:');
    console.log('  ID:', post.id);
    console.log('  Title:', post.title);
    console.log('  Created:', post.createdAt);
    console.log('  Video URL:', post.videos[0]);
    console.log('  Thumbnail:', post.videoThumbnails?.[0] || 'NONE');
    console.log('  Is Cloudinary?', post.videos[0].includes('cloudinary'));
  }
  
  await prisma.$disconnect();
  process.exit(0);
}

checkLatestVideo();
