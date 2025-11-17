const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncDatabaseSchema() {
  console.log('🔄 Syncing database schema with Prisma...\n');

  try {
    // Check what columns exist in transactions table
    console.log('1️⃣ Checking transactions table structure...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `;
    
    console.log('Current columns:', result.map(r => r.column_name).join(', '));
    
    const existingColumns = result.map(r => r.column_name);
    const requiredColumns = ['status', 'type', 'amount', 'fee', 'netAmount', 'currency', 'reference'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️ Missing columns: ${missingColumns.join(', ')}`);
      console.log('\n2️⃣ Adding missing columns...\n');
      
      // Add status column if missing
      if (missingColumns.includes('status')) {
        console.log('   Adding status column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';
        `;
        console.log('   ✅ status column added');
      }
      
      // Add type column if missing
      if (missingColumns.includes('type')) {
        console.log('   Adding type column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'DEPOSIT';
        `;
        console.log('   ✅ type column added');
      }
      
      // Add other missing columns
      if (missingColumns.includes('fee')) {
        console.log('   Adding fee column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) NOT NULL DEFAULT 0;
        `;
        console.log('   ✅ fee column added');
      }
      
      if (missingColumns.includes('netAmount')) {
        console.log('   Adding netAmount column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;
        `;
        console.log('   ✅ netAmount column added');
      }
      
      console.log('\n✅ All missing columns added!');
    } else {
      console.log('✅ All required columns exist!');
    }
    
    // Verify the fix
    console.log('\n3️⃣ Verifying schema...');
    const transactionCount = await prisma.transaction.count();
    console.log(`✅ Transactions table working! Count: ${transactionCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);
    
    const walletCount = await prisma.wallet.count();
    console.log(`✅ Wallets: ${walletCount}`);
    
    console.log('\n✅ Database schema synced successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDatabaseSchema();
