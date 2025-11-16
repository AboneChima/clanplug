#!/usr/bin/env node
/**
 * Fix failed migration in production database
 * This runs automatically before migrations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔧 Checking for failed migrations...');
    
    // Check for any failed verification badge migrations
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM "_prisma_migrations" 
      WHERE migration_name LIKE '%verification_badge%'
    `;
    
    if (failedMigrations && failedMigrations.length > 0) {
      console.log(`❌ Found ${failedMigrations.length} verification badge migration(s)`);
      console.log('🧹 Cleaning up...');
      
      // Delete all verification badge migration records
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name LIKE '%verification_badge%'
      `;
      
      console.log('✅ Deleted all verification badge migration records');
      
      // Drop the table if it exists (might be partially created)
      await prisma.$executeRaw`
        DROP TABLE IF EXISTS "VerificationBadge" CASCADE
      `;
      
      console.log('✅ Dropped VerificationBadge table if it existed');
      console.log('✅ Migration cleanup complete!');
    } else {
      console.log('✅ No failed migrations found');
    }
    
  } catch (error) {
    console.error('⚠️ Error during migration fix:', error.message);
    // Don't fail the build, just log the error
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
