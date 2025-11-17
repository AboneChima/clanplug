const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncDatabaseSchema() {
  console.log('🔄 Syncing database schema with Prisma...\n');

  try {
    // First, create missing enum types
    console.log('1️⃣ Creating enum types...');
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PROCESSING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✅ TransactionStatus enum created');
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PURCHASE', 'SALE', 'VTU_PURCHASE', 'ESCROW_DEPOSIT', 'ESCROW_RELEASE', 'FEE_CHARGE', 'REFUND');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✅ TransactionType enum created');
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "Currency" AS ENUM ('NGN', 'USD', 'LMC');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✅ Currency enum created\n');
    
    // Check what columns exist in transactions table
    console.log('2️⃣ Checking transactions table structure...');
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
    
    // Check if status column exists but is wrong type
    console.log('\n3️⃣ Checking column types...');
    const statusColumn = result.find(r => r.column_name === 'status');
    if (statusColumn && statusColumn.data_type === 'text') {
      console.log('   ⚠️ status column is TEXT, converting to enum...');
      await prisma.$executeRaw`
        ALTER TABLE transactions 
        ALTER COLUMN status TYPE "TransactionStatus" 
        USING status::"TransactionStatus";
      `;
      console.log('   ✅ status column converted to enum');
    }
    
    const typeColumn = result.find(r => r.column_name === 'type');
    if (typeColumn && typeColumn.data_type === 'text') {
      console.log('   ⚠️ type column is TEXT, converting to enum...');
      await prisma.$executeRaw`
        ALTER TABLE transactions 
        ALTER COLUMN type TYPE "TransactionType" 
        USING type::"TransactionType";
      `;
      console.log('   ✅ type column converted to enum');
    }
    
    const currencyColumn = result.find(r => r.column_name === 'currency');
    if (currencyColumn && currencyColumn.data_type === 'text') {
      console.log('   ⚠️ currency column is TEXT, converting to enum...');
      await prisma.$executeRaw`
        ALTER TABLE transactions 
        ALTER COLUMN currency TYPE "Currency" 
        USING currency::"Currency";
      `;
      console.log('   ✅ currency column converted to enum\n');
    }
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️ Missing columns: ${missingColumns.join(', ')}`);
      console.log('\n4️⃣ Adding missing columns...\n');
      
      // Add status column if missing
      if (missingColumns.includes('status')) {
        console.log('   Adding status column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS status "TransactionStatus" NOT NULL DEFAULT 'PENDING'::"TransactionStatus";
        `;
        console.log('   ✅ status column added');
      }
      
      // Add type column if missing
      if (missingColumns.includes('type')) {
        console.log('   Adding type column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS type "TransactionType" NOT NULL DEFAULT 'DEPOSIT'::"TransactionType";
        `;
        console.log('   ✅ type column added');
      }
      
      // Add currency column if missing
      if (missingColumns.includes('currency')) {
        console.log('   Adding currency column...');
        await prisma.$executeRaw`
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS currency "Currency" NOT NULL DEFAULT 'NGN'::"Currency";
        `;
        console.log('   ✅ currency column added');
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
    console.log('\n5️⃣ Verifying schema...');
    const transactionCount = await prisma.transaction.count();
    console.log(`✅ Transactions table working! Count: ${transactionCount}`);
    
    const userCount = await prisma.user.count();
    console.log(`✅ Users: ${userCount}`);
    
    const walletCount = await prisma.wallet.count();
    console.log(`✅ Wallets: ${walletCount}`);
    
    const badgeCount = await prisma.verificationBadge.count();
    console.log(`✅ VerificationBadges: ${badgeCount}`);
    
    console.log('\n✅ Database schema synced successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDatabaseSchema();
