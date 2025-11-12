import { PrismaClient, Currency, UserStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random referral codes
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  console.log('🌱 Creating admin user...');

  // Create admin user
  const adminData = {
    email: 'admin@lordmoon.local',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    password: 'Admin123!',
    status: 'ACTIVE' as UserStatus,
    role: 'ADMIN' as UserRole
  };

  const passwordHash = await bcrypt.hash(adminData.password, 12);
  const referralCode = generateReferralCode();

  const adminUser = await prisma.user.upsert({
    where: { email: adminData.email },
    update: {},
    create: {
      email: adminData.email,
      username: adminData.username,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      referralCode,
      passwordHash,
      status: adminData.status,
      role: adminData.role,
      isEmailVerified: true
    }
  });

  console.log(`✅ Created admin user: ${adminData.username} (${adminData.email})`);

  // Create wallets for admin user
  const walletData = [
    { userId: adminUser.id, currency: Currency.NGN, balance: 100000.00 },
    { userId: adminUser.id, currency: Currency.USD, balance: 500.00 }
  ];

  for (const wallet of walletData) {
    await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: wallet.userId,
          currency: wallet.currency
        }
      },
      update: {
        balance: wallet.balance,
        totalDeposits: wallet.balance
      },
      create: {
        userId: wallet.userId,
        currency: wallet.currency,
        balance: wallet.balance,
        totalDeposits: wallet.balance,
        totalWithdrawals: 0
      }
    });
  }

  console.log('✅ Created admin wallets with initial balances');

  console.log('\n🎉 Admin user creation completed successfully!');
  console.log('\n🔑 Admin Credentials:');
  console.log('   Email: admin@lordmoon.local');
  console.log('   Password: Admin123!');
  console.log('   Role: ADMIN');
}

main()
  .catch((e) => {
    console.error('❌ Admin seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });