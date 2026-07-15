/**
 * Add watermark to all existing videos
 * This script processes all videos that were uploaded before the watermark feature
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || '/var/www/clanplug/uploads';

/**
 * Add watermark to video using ffmpeg
 */
async function addVideoWatermark(videoPath) {
  try {
    // Generate watermarked video filename
    const ext = path.extname(videoPath);
    const dir = path.dirname(videoPath);
    const basename = path.basename(videoPath, ext);
    const watermarkedPath = path.join(dir, `${basename}_watermarked${ext}`);
    
    // FFmpeg command to add centered watermark at bottom
    const command = `ffmpeg -i "${videoPath}" -vf "drawtext=text='clanplug':fontsize=24:fontcolor=white@0.8:x=(w-text_w)/2:y=h-th-50:shadowcolor=black@0.5:shadowx=2:shadowy=2" -codec:a copy "${watermarkedPath}" -y`;
    
    console.log(`💧 Adding watermark to: ${videoPath}`);
    await execAsync(command);
    
    // Delete original video and rename watermarked version
    fs.unlinkSync(videoPath);
    fs.renameSync(watermarkedPath, videoPath);
    
    console.log(`✅ Watermark added: ${videoPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add watermark to ${videoPath}:`, error.message);
    return false;
  }
}

/**
 * Convert URL to file path
 */
function urlToFilePath(url) {
  // Remove base URL to get relative path
  const relativePath = url.replace('https://api.clanplug.site/uploads', '');
  return path.join(UPLOAD_BASE_DIR, relativePath);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔍 Fetching all posts with videos...');
    
    // Get all posts that have videos
    const posts = await prisma.post.findMany({
      where: {
        videos: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        videos: true,
        type: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${posts.length} posts with videos`);
    
    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const post of posts) {
      console.log(`\n📹 Processing post ${post.id} (${post.type})...`);
      
      for (const videoUrl of post.videos) {
        const videoPath = urlToFilePath(videoUrl);
        
        // Check if file exists
        if (!fs.existsSync(videoPath)) {
          console.log(`⚠️ Video file not found: ${videoPath}`);
          skippedCount++;
          continue;
        }
        
        // Check if video is on Cloudinary (old videos)
        if (videoUrl.includes('cloudinary.com')) {
          console.log(`⚠️ Skipping Cloudinary video: ${videoUrl}`);
          skippedCount++;
          continue;
        }
        
        // Add watermark
        const success = await addVideoWatermark(videoPath);
        
        if (success) {
          processedCount++;
        } else {
          failedCount++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Processing complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total posts: ${posts.length}`);
    console.log(`   - Videos processed: ${processedCount}`);
    console.log(`   - Videos failed: ${failedCount}`);
    console.log(`   - Videos skipped: ${skippedCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
