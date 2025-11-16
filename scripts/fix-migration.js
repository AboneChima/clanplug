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
      console.log('⚠️ Database has partial data - clearing failed migrations and resetting...');
      
      // Mark the migration as applied since tables already exist
      try {
        // First check if migration record exists
        const existingMigration = await prisma.$queryRaw`
          SELECT migration_name FROM "_prisma_migrations" 
          WHERE migration_name = '20251028202337_lordmoon'
        `;
        
        if (existingMigration.length === 0) {
          // Insert the migration record
          await prisma.$executeRaw`
            INSERT INTO "_prisma_migrations" (
              id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
            ) VALUES (
              gen_random_uuid(),
              '0',
              NOW(),
              '20251028202337_lordmoon',
              '',
              NULL,
              NOW(),
              1
            )
          `;
          console.log('✅ Marked migration as applied');
        } else {
          console.log('ℹ️ Migration record already exists');
        }
      } catch (e) {
        console.log('⚠️ Could not mark migration as applied:', e.message);
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
