#!/usr/bin/env node
/**
 * Recreate User table and attempt to recover user data from related tables
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recreateUserTable() {
  try {
    console.log('🔧 Attempting to recreate User table...\n');
    
    // Check if User table exists
    const userTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'User'
      ) as exists
    `;
    
    if (userTableExists[0]?.exists) {
      console.log('✅ User table already exists');
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log(`   Found ${userCount[0].count} users`);
      return;
    }
    
    console.log('⚠️ User table does not exist. Creating it...');
    
    // Create User table with basic structure
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
        "isVerified" BOOLEAN DEFAULT false,
        role TEXT DEFAULT 'user',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✅ User table created');
    
    // Try to find unique user IDs from related tables
    console.log('\n🔍 Checking for user references in other tables...');
    
    const walletUsers = await prisma.$queryRaw`
      SELECT DISTINCT "userId" FROM wallets WHERE "userId" IS NOT NULL
    `;
    console.log(`   Found ${walletUsers.length} unique user IDs in wallets`);
    
    const postUsers = await prisma.$queryRaw`
      SELECT DISTINCT "authorId" FROM posts WHERE "authorId" IS NOT NULL
    `;
    console.log(`   Found ${postUsers.length} unique user IDs in posts`);
    
    // Collect all unique user IDs
    const allUserIds = new Set();
    walletUsers.forEach(w => allUserIds.add(w.userId));
    postUsers.forEach(p => allUserIds.add(p.authorId));
    
    console.log(`\n📊 Total unique user IDs found: ${allUserIds.size}`);
    
    if (allUserIds.size > 0) {
      console.log('\n⚠️ WARNING: User data was lost. You have orphaned data.');
      console.log('   Options:');
      console.log('   1. Restore from Render database backup (recommended)');
      console.log('   2. Create placeholder users for the orphaned data');
      console.log('   3. Contact users to re-register');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

recreateUserTable();
