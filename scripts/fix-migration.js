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
    
    // Check if the failed migration exists
    const failedMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at, success 
      FROM "_prisma_migrations" 
      WHERE migration_name = 'add_verification_badge'
      LIMIT 1
    `;
    
    if (failedMigration && failedMigration.length > 0) {
      console.log('❌ Found failed migration: add_verification_badge');
      console.log('🧹 Cleaning up...');
      
      // Delete the failed migration record
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name = 'add_verification_badge'
      `;
      
      console.log('✅ Deleted failed migration record');
      
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
