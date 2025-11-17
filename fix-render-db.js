const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRenderDatabase() {
  console.log('🔧 Fixing Render Database...\n');

  try {
    // 1. Check current state
    console.log('1️⃣ Checking database state...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users\n`);

    // 2. Check if VerificationBadge table exists
    console.log('2️⃣ Checking VerificationBadge table...');
    try {
      const badgeCount = await prisma.verificationBadge.count();
      console.log(`✅ VerificationBadge table exists with ${badgeCount} badges\n`);
      console.log('✅ Database is healthy! No fixes needed.');
    } catch (error) {
      console.log('❌ VerificationBadge table has issues. Running migration...\n');
      
      // 3. Run the migration SQL directly
      console.log('3️⃣ Creating VerificationBadge table...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "verification_badges" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'none',
          "purchasedAt" TIMESTAMP(3),
          "expiresAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "verification_badges_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✅ Table created\n');

      // 4. Create unique index
      console.log('4️⃣ Creating unique index...');
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "verification_badges_userId_key" 
        ON "verification_badges"("userId");
      `);
      console.log('✅ Index created\n');

      // 5. Add foreign key
      console.log('5️⃣ Adding foreign key constraint...');
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'verification_badges_userId_fkey'
          ) THEN
            ALTER TABLE "verification_badges" 
            ADD CONSTRAINT "verification_badges_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Foreign key added\n');

      console.log('✅ Database fixed successfully!');
    }

    // 6. Verify the fix
    console.log('\n6️⃣ Verifying fix...');
    const finalBadgeCount = await prisma.verificationBadge.count();
    console.log(`✅ VerificationBadge table working! Count: ${finalBadgeCount}`);
    
    // 7. Show sample users
    console.log('\n7️⃣ Sample users:');
    const users = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        createdAt: true,
      },
      take: 5,
    });
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
    });

    console.log('\n✅ All done! Your database is ready.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRenderDatabase();
