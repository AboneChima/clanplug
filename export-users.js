const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportUsers() {
  try {
    console.log('📊 Fetching users from database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        bio: true,
        avatar: true,
        isKYCVerified: true,
        kycStatus: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        // Include related data
        verificationBadge: {
          select: {
            status: true,
            expiresAt: true,
          }
        },
        wallet: {
          select: {
            balance: true,
            totalDeposits: true,
            totalWithdrawals: true,
          }
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${users.length} users`);

    // Format the data
    const formattedUsers = users.map(user => ({
      ...user,
      walletBalance: user.wallet?.balance || 0,
      totalDeposits: user.wallet?.totalDeposits || 0,
      totalWithdrawals: user.wallet?.totalWithdrawals || 0,
      verificationBadgeStatus: user.verificationBadge?.status || 'none',
      badgeExpiresAt: user.verificationBadge?.expiresAt || null,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      // Remove nested objects after extracting
      wallet: undefined,
      verificationBadge: undefined,
      _count: undefined,
    }));

    // Save to JSON file
    const jsonFilename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(formattedUsers, null, 2));
    console.log(`✅ JSON export saved to: ${jsonFilename}`);

    // Save to CSV file
    const csvFilename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    const headers = Object.keys(formattedUsers[0] || {}).join(',');
    const rows = formattedUsers.map(user => 
      Object.values(user).map(val => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        if (val instanceof Date) return val.toISOString();
        return val;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    fs.writeFileSync(csvFilename, csv);
    console.log(`✅ CSV export saved to: ${csvFilename}`);

    // Print summary statistics
    console.log('\n📊 User Statistics:');
    console.log(`Total Users: ${users.length}`);
    console.log(`KYC Verified: ${users.filter(u => u.isKYCVerified).length}`);
    console.log(`Banned Users: ${users.filter(u => u.isBanned).length}`);
    console.log(`Users with Verification Badge: ${users.filter(u => u.verificationBadge?.status === 'active' || u.verificationBadge?.status === 'verified').length}`);
    console.log(`Users with Phone Number: ${users.filter(u => u.phone).length}`);
    
    const totalBalance = formattedUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    console.log(`Total Wallet Balance: ₦${totalBalance.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error exporting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportUsers();
