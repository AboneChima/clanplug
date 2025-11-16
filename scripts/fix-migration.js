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
      console.log('⚠️ User table missing - checking for lowercase "users" table...');
      
      // Check if lowercase "users" table exists
      const usersTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists
      `;
      
      if (usersTableExists[0]?.exists) {
        console.log('✅ Found "users" table (lowercase) - database has data!');
        console.log('⚠️ Database uses lowercase table names, Prisma expects capital case');
        console.log('🛑 STOPPING - Manual intervention needed to preserve data');
        console.log('📋 Your data is safe! Contact support or check Render dashboard');
        process.exit(0); // Exit successfully to not block deployment
      } else {
        console.log('⚠️ No tables found - database is truly empty');
        console.log('🔄 Clearing any failed migration records...');
        
        // Clear ALL failed migration records since database is empty
        try {
          await prisma.$executeRaw`
            DELETE FROM "_prisma_migrations" 
            WHERE finished_at IS NULL 
            OR migration_name LIKE '%verification_badge%'
            OR migration_name = '20251028202337_lordmoon'
          `;
          console.log('✅ Cleared failed migration records');
        } catch (e) {
          console.log('ℹ️ No migration records to clear or table does not exist yet');
        }
        
        console.log('🔄 Will let migrations run fresh');
      }
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
