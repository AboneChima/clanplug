const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addVideoThumbnailsColumn() {
  try {
    console.log('Adding videoThumbnails column to posts table...');
    
    // Check if column exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='posts' AND column_name='videoThumbnails';
    `);
    
    if (result.length > 0) {
      console.log('✓ Column videoThumbnails already exists');
      return;
    }
    
    // Add the column
    await prisma.$queryRawUnsafe(`
      ALTER TABLE posts ADD COLUMN "videoThumbnails" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    
    console.log('✓ Successfully added videoThumbnails column');
    
    // Update existing posts with videos to have empty array
    const updated = await prisma.$executeRawUnsafe(`
      UPDATE posts 
      SET "videoThumbnails" = ARRAY[]::TEXT[] 
      WHERE "videoThumbnails" IS NULL;
    `);
    
    console.log(`✓ Updated ${updated} existing posts`);
    
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addVideoThumbnailsColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
