const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const UPLOAD_BASE_DIR = '/var/www/clanplug/uploads';
const THUMBNAILS_DIR = path.join(UPLOAD_BASE_DIR, 'thumbnails');
const BASE_URL = 'https://api.clanplug.site/uploads/thumbnails';

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true});
    console.log(`Created directory: ${dirPath}`);
  }
}

async function fixLatestVideo() {
  try {
    console.log('🔍 Finding latest video post...\n');
    
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
    
    if (!post) {
      console.log('No video posts found');
      return;
    }
    
    console.log('📝 Latest video post:');
    console.log(`   ID: ${post.id}`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Video: ${post.videos[0]}`);
    console.log(`   Has thumbnail: ${post.videoThumbnails?.length > 0 ? 'YES' : 'NO'}\n`);
    
    if (post.videoThumbnails && post.videoThumbnails.length > 0) {
      console.log('✅ Post already has thumbnail, skipping');
      return;
    }
    
    // Ensure thumbnails directory exists
    await ensureDirectory(THUMBNAILS_DIR);
    
    const videoUrl = post.videos[0];
    const videoPath = videoUrl.replace('https://api.clanplug.site/uploads', UPLOAD_BASE_DIR);
    
    console.log(`🎥 Video path: ${videoPath}`);
    
    // Check if video file exists
    try {
      await fs.access(videoPath);
      console.log('✅ Video file exists');
    } catch {
      console.log('❌ Video file not found at:', videoPath);
      return;
    }
    
    // Generate thumbnail
    const videoFilename = path.basename(videoPath);
    const thumbnailFilename = `thumb_${Date.now()}_${videoFilename.replace(/\.[^.]+$/, '.jpg')}`;
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    const thumbnailUrl = `${BASE_URL}/${thumbnailFilename}`;
    
    console.log(`🖼️  Generating thumbnail: ${thumbnailFilename}`);
    
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=720:-2" "${thumbnailPath}" -y`;
    
    try {
      await execAsync(command);
      console.log('✅ Thumbnail created successfully');
      
      // Update post with thumbnail
      await prisma.post.update({
        where: { id: post.id },
        data: { videoThumbnails: [thumbnailUrl] }
      });
      
      console.log('💾 Post updated with thumbnail URL');
      console.log(`   Thumbnail URL: ${thumbnailUrl}`);
      
    } catch (error) {
      console.error('❌ Failed to create thumbnail:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixLatestVideo()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
