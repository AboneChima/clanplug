const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuration
const UPLOADS_DIR = '/var/www/clanplug/uploads';
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
const BASE_URL = 'https://api.clanplug.site/uploads/thumbnails';

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function createVideoThumbnail(videoPath, outputPath) {
  try {
    // Extract frame at 1 second
    await execAsync(
      `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=720:-2" "${outputPath}" -y`
    );
    return true;
  } catch (error) {
    console.error(`Failed to create thumbnail for ${videoPath}:`, error.message);
    return false;
  }
}

async function regenerateThumbnails() {
  try {
    console.log('🎬 Starting video thumbnail regeneration...\n');
    
    // Ensure thumbnails directory exists
    await ensureDirectory(THUMBNAILS_DIR);
    
    // Find all posts with videos but no thumbnails
    const postsWithVideos = await prisma.post.findMany({
      where: {
        videos: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        videos: true,
        videoThumbnails: true,
        title: true
      }
    });
    
    console.log(`Found ${postsWithVideos.length} posts with videos\n`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const post of postsWithVideos) {
      console.log(`\n📝 Processing post: ${post.id} - "${post.title}"`);
      console.log(`   Videos: ${post.videos.length}`);
      console.log(`   Existing thumbnails: ${post.videoThumbnails?.length || 0}`);
      
      const thumbnails = [];
      
      for (let i = 0; i < post.videos.length; i++) {
        const videoUrl = post.videos[i];
        const videoFileName = path.basename(videoUrl);
        const videoPath = path.join(VIDEOS_DIR, videoFileName);
        
        console.log(`   🎥 Processing video ${i + 1}/${post.videos.length}: ${videoFileName}`);
        
        // Check if thumbnail already exists
        if (post.videoThumbnails && post.videoThumbnails[i]) {
          console.log(`   ⏭️  Thumbnail already exists, skipping`);
          thumbnails.push(post.videoThumbnails[i]);
          skippedCount++;
          continue;
        }
        
        // Check if video file exists
        try {
          await fs.access(videoPath);
        } catch {
          console.log(`   ⚠️  Video file not found: ${videoPath}`);
          failedCount++;
          continue;
        }
        
        // Generate thumbnail
        const thumbnailFileName = `thumb_${Date.now()}_${i}_${videoFileName.replace(/\.[^.]+$/, '.jpg')}`;
        const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFileName);
        const thumbnailUrl = `${BASE_URL}/${thumbnailFileName}`;
        
        console.log(`   🖼️  Generating thumbnail: ${thumbnailFileName}`);
        const success = await createVideoThumbnail(videoPath, thumbnailPath);
        
        if (success) {
          thumbnails.push(thumbnailUrl);
          console.log(`   ✅ Thumbnail created successfully`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to create thumbnail`);
          failedCount++;
        }
      }
      
      // Update post with thumbnails
      if (thumbnails.length > 0) {
        await prisma.post.update({
          where: { id: post.id },
          data: { videoThumbnails: thumbnails }
        });
        console.log(`   💾 Updated post with ${thumbnails.length} thumbnail(s)`);
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log(`   ✅ Successfully created: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📝 Total posts processed: ${postsWithVideos.length}`);
    
  } catch (error) {
    console.error('Error regenerating thumbnails:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

regenerateThumbnails()
  .then(() => {
    console.log('\n✅ Thumbnail regeneration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Thumbnail regeneration failed:', error);
    process.exit(1);
  });
