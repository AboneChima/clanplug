const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function forceResetDatabase() {
  console.log('🚨 FORCE RESETTING DATABASE...\n');

  try {
    console.log('1️⃣ Dropping all tables...');
    
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    
    console.log(`Found ${tables.length} tables to drop`);
    
    // Drop each table
    for (const table of tables) {
      console.log(`   Dropping ${table.tablename}...`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
    }
    
    console.log('✅ All tables dropped\n');
    
    // Drop all enum types
    console.log('2️⃣ Dropping enum types...');
    const enums = await prisma.$queryRaw`
      SELECT t.typname as enumtype
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `;
    
    for (const enumType of enums) {
      console.log(`   Dropping enum ${enumType.enumtype}...`);
      await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${enumType.enumtype}" CASCADE;`);
    }
    
    console.log('✅ All enums dropped\n');
    
    await prisma.$disconnect();
    
    console.log('3️⃣ Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('\n✅ DATABASE COMPLETELY RESET!');
    console.log('All tables have been recreated from scratch.');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

forceResetDatabase();
