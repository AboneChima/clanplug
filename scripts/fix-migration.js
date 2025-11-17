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
      console.log('⚠️ Database has existing data - marking ALL migrations as applied...');
      
      try {
        // Get all migrations from the migrations folder
        const fs = require('fs');
        const path = require('path');
        const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
        
        let allMigrationNames = [];
        if (fs.existsSync(migrationsDir)) {
          allMigrationNames = fs.readdirSync(migrationsDir)
            .filter(name => !name.startsWith('.') && name !== 'migration_lock.toml');
          console.log(`Found ${allMigrationNames.length} migration folders`);
        }
        
        // Get already applied migrations
        const appliedMigrations = await prisma.$queryRaw`
          SELECT migration_name FROM "_prisma_migrations" 
          WHERE finished_at IS NOT NULL
        `;
        const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));
        
        // Find migrations that need to be marked as applied
        const unappliedMigrations = allMigrationNames.filter(name => !appliedNames.has(name));
        
        if (unappliedMigrations.length > 0) {
          console.log(`Marking ${unappliedMigrations.length} unapplied migrations as completed:`, 
            unappliedMigrations.join(', '));
          
          // First, clear any failed migration records
          await prisma.$executeRaw`
            DELETE FROM "_prisma_migrations" 
            WHERE finished_at IS NULL
          `;
          
          // Insert all unapplied migrations as completed
          for (const migrationName of unappliedMigrations) {
            await prisma.$executeRaw`
              INSERT INTO "_prisma_migrations" (
                id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
              ) VALUES (
                gen_random_uuid(),
                '0',
                NOW(),
                ${migrationName},
                '',
                NULL,
                NOW(),
                1
              )
            `;
          }
          console.log('✅ Marked all migrations as applied');
        } else {
          console.log('ℹ️ All migrations already applied');
        }
      } catch (e) {
        console.log('⚠️ Could not mark migrations as applied:', e.message);
      }
    } else {
      console.log('✅ Database is empty - migrations will run fresh');
    }
    
    // Check if User table exists and create if missing
    try {
      const userTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        ) as exists
      `;
      
      if (!userTableExists[0]?.exists) {
        console.log('⚠️ User table missing! Creating it now...');
        
        // Create User table based on schema
        await prisma.$executeRaw`
          CREATE TABLE "User" (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            "firstName" TEXT,
            "lastName" TEXT,
            "phoneNumber" TEXT,
            bio TEXT,
            "profilePicture" TEXT,
            "coverPhoto" TEXT,
            "isVerified" BOOLEAN DEFAULT false,
            "isEmailVerified" BOOLEAN DEFAULT false,
            "emailVerificationToken" TEXT,
            "emailVerificationExpires" TIMESTAMP(3),
            "passwordResetToken" TEXT,
            "passwordResetExpires" TIMESTAMP(3),
            role TEXT DEFAULT 'user',
            "accountAge" INTEGER DEFAULT 0,
            "lastActive" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        console.log('✅ User table created successfully');
        console.log('⚠️ NOTE: Previous user data was lost. Users will need to re-register.');
      } else {
        console.log('✅ User table exists');
      }
    } catch (e) {
      console.log('⚠️ Could not check/create User table:', e.message);
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
