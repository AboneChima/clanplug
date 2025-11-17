const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVerificationAPI() {
  try {
    console.log('🔍 Testing Verification API...\n');

    // Test 1: Check if VerificationBadge table exists
    console.log('1️⃣ Checking VerificationBadge table...');
    try {
      const count = await prisma.verificationBadge.count();
      console.log(`✅ VerificationBadge table exists with ${count} records\n`);
    } catch (error) {
      console.error('❌ VerificationBadge table error:', error.message);
      console.log('💡 Run: npx prisma migrate deploy\n');
      return;
    }

    // Test 2: Check if any users exist
    console.log('2️⃣ Checking users...');
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        username: true,
        email: true,
        verificationBadge: true,
      },
    });
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database\n');
      return;
    }
    
    console.log(`✅ Found ${users.length} users\n`);

    // Test 3: Check verification badges
    console.log('3️⃣ Checking verification badges...');
    for (const user of users) {
      console.log(`   User: ${user.username} (${user.email})`);
      if (user.verificationBadge) {
        console.log(`   Badge Status: ${user.verificationBadge.status}`);
        if (user.verificationBadge.expiresAt) {
          console.log(`   Expires: ${user.verificationBadge.expiresAt}`);
        }
      } else {
        console.log(`   Badge Status: none (no badge record)`);
      }
      console.log('');
    }

    // Test 4: Test creating a badge for first user
    const testUser = users[0];
    console.log(`4️⃣ Testing badge creation for ${testUser.username}...`);
    
    if (!testUser.verificationBadge) {
      const badge = await prisma.verificationBadge.create({
        data: {
          userId: testUser.id,
          status: 'none',
        },
      });
      console.log('✅ Badge created successfully:', badge);
    } else {
      console.log('✅ Badge already exists');
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - VerificationBadge table is working');
    console.log('   - User relations are correct');
    console.log('   - API should be functional');
    console.log('\n💡 If you\'re still getting errors, check:');
    console.log('   1. Backend server is running');
    console.log('   2. NEXT_PUBLIC_API_URL is set correctly in frontend');
    console.log('   3. Authentication token is valid');
    console.log('   4. Check browser console for specific error messages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVerificationAPI();
