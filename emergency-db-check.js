const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emergencyDatabaseCheck() {
  console.log('🚨 EMERGENCY DATABASE CHECK\n');

  try {
    // Check what tables actually exist
    console.log('1️⃣ Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Found tables:', tables.map(t => t.table_name).join(', '));
    console.log('');
    
    // Check if we have Users (capital) or users (lowercase)
    const hasCapitalUsers = tables.some(t => t.table_name === 'Users');
    const hasLowercaseUsers = tables.some(t => t.table_name === 'users');
    
    console.log('2️⃣ User table status:');
    console.log(`   Capital "Users": ${hasCapitalUsers ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   Lowercase "users": ${hasLowercaseUsers ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log('');
    
    if (hasCapitalUsers && !hasLowercaseUsers) {
      console.log('⚠️ PROBLEM DETECTED: Tables use Capital case but Prisma expects lowercase!');
      console.log('');
      console.log('3️⃣ Checking if we can query the Users table...');
      
      try {
        const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Users"`;
        console.log(`   Found ${userCount[0].count} users in "Users" table`);
        console.log('');
        
        if (parseInt(userCount[0].count) > 0) {
          console.log('✅ DATA EXISTS! We need to rename tables, not recreate them.');
          console.log('');
          console.log('4️⃣ Listing all tables that need renaming...');
          
          const allTables = tables.map(t => t.table_name);
          const needsRename = allTables.filter(name => name[0] === name[0].toUpperCase());
          
          console.log('Tables to rename:', needsRename.join(', '));
        } else {
          console.log('⚠️ No data found. Safe to recreate database.');
        }
      } catch (error) {
        console.log('❌ Cannot query Users table:', error.message);
      }
    } else if (hasLowercaseUsers) {
      console.log('✅ Tables are correctly named (lowercase)');
      
      // Check user count
      const userCount = await prisma.user.count();
      console.log(`   Found ${userCount} users`);
    } else {
      console.log('❌ NO USER TABLE FOUND AT ALL!');
      console.log('   Database appears to be empty or corrupted.');
      console.log('   You need to run: npx prisma migrate deploy');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyDatabaseCheck();
