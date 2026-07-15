const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVideoUrls() {
  const post = await prisma.post.findFirst({
    where: {
      videos: {
        isEmpty: false
      }
    }
  });
  
  if (post) {
    console.log('Sample video URL:', post.videos[0]);
    console.log('Is Cloudinary?', post.videos[0].includes('cloudinary'));
  }
  
  await prisma.$disconnect();
  process.exit(0);
}

checkVideoUrls();
