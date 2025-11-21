/**
 * Script to upgrade user to admin role
 * Run: node upgrade-to-admin.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function upgradeToAdmin() {
  try {
    console.log('🔧 Upgrading user to admin...\n');

    const email = 'admin@clanplug.com';

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    console.log('✅ User upgraded to admin successfully!\n');
    console.log('📧 Email:', updatedUser.email);
    console.log('👤 Username:', updatedUser.username);
    console.log('🎭 Role:', updatedUser.role);
    console.log('✉️  Email Verified:', updatedUser.isEmailVerified);
    console.log('\n🌐 You can now login at: https://clanplug.site/login');
    console.log('🌐 Admin panel: https://clanplug.site/admin');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2025') {
      console.log('\n⚠️  User not found. Make sure the user was created first.');
      console.log('   Run: node create-admin-render.js');
    }
  } finally {
    await prisma.$disconnect();
  }
}

upgradeToAdmin();
