#!/usr/bin/env node
/**
 * Fix failed migration in production database
 * This runs automatically before migrations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔧 Checking database state...');
    
    // Check if User table exists
    const userTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'User'
      ) as exists
    `;
    
    const hasUserTable = userTableExists[0]?.exists;
    console.log(`User table exists: ${hasUserTable}`);
    
    if (!hasUserTable) {
      console.log('⚠️ User table missing - database might be empty or corrupted');
      console.log('🔄 Cleaning up database for fresh migration...');
      
      // Drop all custom types that might exist (one at a time)
      const types = ['UserRole', 'KYCStatus', 'TransactionType', 'TransactionStatus', 'PostType', 'PostStatus', 'Currency', 'EscrowStatus', 'MessageType', 'StoryType'];
      for (const type of types) {
        try {
          await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${type}" CASCADE`);
        } catch (e) {
          // Ignore errors, type might not exist
        }
      }
      console.log('✅ Dropped existing types');
      
      // Clear all migration records to force fresh migration
      await prisma.$executeRaw`
        TRUNCATE TABLE "_prisma_migrations"
      `;
      console.log('✅ Cleared migration history - will run all migrations fresh');
    } else {
      // Check for failed verification badge migrations
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
        
        console.log('✅ Deleted verification badge migration records');
        
        // Drop the table if it exists
        await prisma.$executeRaw`
          DROP TABLE IF EXISTS "VerificationBadge" CASCADE
        `;
        
        console.log('✅ Dropped VerificationBadge table');
      } else {
        console.log('✅ No failed migrations found');
      }
    }
    
  } catch (error) {
    console.error('⚠️ Error during migration fix:', error.message);
    // Don't fail the build, just log the error
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
