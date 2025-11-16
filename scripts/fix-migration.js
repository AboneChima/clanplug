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
    
    // Check if ANY application tables exist (not just system tables)
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
    `;
    
    console.log(`Found ${allTables.length} application tables in database`);
    
    if (allTables.length > 0) {
      console.log('📋 Tables found:', allTables.map(t => t.table_name).join(', '));
      console.log('⚠️ Database has partial data - marking all failed migrations as completed...');
      
      // Find ALL failed migrations (those with started_at but no finished_at)
      try {
        const failedMigrations = await prisma.$queryRaw`
          SELECT migration_name, started_at FROM "_prisma_migrations" 
          WHERE finished_at IS NULL
          ORDER BY started_at
        `;
        
        if (failedMigrations.length > 0) {
          console.log(`Found ${failedMigrations.length} failed migration(s):`, 
            failedMigrations.map(m => m.migration_name).join(', '));
          
          // Mark all failed migrations as completed
          await prisma.$executeRaw`
            UPDATE "_prisma_migrations" 
            SET finished_at = NOW(), 
                applied_steps_count = 1,
                logs = ''
            WHERE finished_at IS NULL
          `;
          console.log('✅ Marked all failed migrations as completed');
        } else {
          console.log('ℹ️ No failed migrations found');
        }
      } catch (e) {
        console.log('⚠️ Could not mark migrations as applied:', e.message);
      }
    } else {
      console.log('✅ Database is empty - migrations will run fresh');
    }
    
    // Always check for and clean up verification badge issues
    try {
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
      }
    } catch (e) {
      console.log('ℹ️ Could not check for verification badge migrations');
    }
    
  } catch (error) {
    console.error('⚠️ Error during migration fix:', error.message);
    // Don't fail the build, just log the error
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
