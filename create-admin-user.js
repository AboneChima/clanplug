/**
 * Script to create an admin user
 * Run: node create-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...\n');

    const adminEmail = 'admin@clanplug.com';
    const adminPassword = 'Admin@2024!';
    const adminUsername = 'admin';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('\n📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('👤 Username:', adminUsername);
      console.log('\n🌐 Login at: http://localhost:3005/login');
      console.log('🌐 Or production: https://clanplug.site/login');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true,
        isKYCVerified: true,
      }
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Username:', adminUsername);
    console.log('🆔 User ID:', admin.id);
    console.log('\n🌐 Login at: http://localhost:3005/login');
    console.log('🌐 Or production: https://clanplug.site/login');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
