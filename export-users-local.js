require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Override DATABASE_URL to connect to VPS
process.env.DATABASE_URL = 'postgresql://lordmoon:Lordmoonwarrior1234567890@176.57.189.248:5432/clanplug?schema=public';

const prisma = new PrismaClient();

async function exportUsers() {
  try {
    console.log('📊 Connecting to VPS database...');
    
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
        lastLogin: true,
        verificationBadge: {
          select: {
            status: true,
            expiresAt: true,
            purchasedAt: true,
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
            sentMessages: true,
            receivedMessages: true,
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
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      phone: user.phone || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      isKYCVerified: user.isKYCVerified,
      kycStatus: user.kycStatus || 'none',
      isBanned: user.isBanned,
      walletBalance: user.wallet?.balance || 0,
      totalDeposits: user.wallet?.totalDeposits || 0,
      totalWithdrawals: user.wallet?.totalWithdrawals || 0,
      verificationBadgeStatus: user.verificationBadge?.status || 'none',
      badgeExpiresAt: user.verificationBadge?.expiresAt || null,
      badgePurchasedAt: user.verificationBadge?.purchasedAt || null,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      messagesCount: user._count.sentMessages + user._count.receivedMessages,
      accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      lastLogin: user.lastLogin || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    // Save to JSON file
    const jsonFilename = `users-export-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(formattedUsers, null, 2));
    console.log(`✅ JSON export saved to: ${jsonFilename}`);

    // Save to CSV file
    const csvFilename = `users-export-${timestamp}.csv`;
    const headers = [
      'ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone', 
      'City', 'State', 'Country', 'KYC Verified', 'KYC Status', 'Is Banned',
      'Wallet Balance', 'Total Deposits', 'Total Withdrawals',
      'Badge Status', 'Badge Expires', 'Posts', 'Followers', 'Following',
      'Messages', 'Account Age (days)', 'Last Login', 'Created At'
    ].join(',');
    
    const rows = formattedUsers.map(user => [
      user.id,
      user.username,
      user.email,
      user.firstName,
      user.lastName,
      user.phone,
      user.city,
      user.state,
      user.country,
      user.isKYCVerified,
      user.kycStatus,
      user.isBanned,
      user.walletBalance,
      user.totalDeposits,
      user.totalWithdrawals,
      user.verificationBadgeStatus,
      user.badgeExpiresAt || '',
      user.postsCount,
      user.followersCount,
      user.followingCount,
      user.messagesCount,
      user.accountAge,
      user.lastLogin || '',
      user.createdAt
    ].map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      if (val instanceof Date) return val.toISOString();
      return val;
    }).join(','));
    
    const csv = [headers, ...rows].join('\n');
    fs.writeFileSync(csvFilename, csv);
    console.log(`✅ CSV export saved to: ${csvFilename}`);

    // Print summary statistics
    console.log('\n📊 USER STATISTICS\n' + '='.repeat(50));
    console.log(`Total Users: ${users.length}`);
    console.log(`KYC Verified: ${users.filter(u => u.isKYCVerified).length}`);
    console.log(`Banned Users: ${users.filter(u => u.isBanned).length}`);
    console.log(`Users with Verification Badge: ${users.filter(u => u.verificationBadge?.status === 'active' || u.verificationBadge?.status === 'verified').length}`);
    console.log(`Users with Phone Number: ${users.filter(u => u.phone).length}`);
    console.log(`Users with Avatar: ${users.filter(u => u.avatar).length}`);
    console.log(`Users with Bio: ${users.filter(u => u.bio).length}`);
    
    const totalBalance = formattedUsers.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    const totalDeposits = formattedUsers.reduce((sum, u) => sum + (u.totalDeposits || 0), 0);
    const totalWithdrawals = formattedUsers.reduce((sum, u) => sum + (u.totalWithdrawals || 0), 0);
    
    console.log(`\n💰 FINANCIAL SUMMARY\n` + '='.repeat(50));
    console.log(`Total Wallet Balance: ₦${totalBalance.toLocaleString()}`);
    console.log(`Total Deposits (all time): ₦${totalDeposits.toLocaleString()}`);
    console.log(`Total Withdrawals (all time): ₦${totalWithdrawals.toLocaleString()}`);
    
    console.log(`\n📈 ENGAGEMENT SUMMARY\n` + '='.repeat(50));
    const totalPosts = formattedUsers.reduce((sum, u) => sum + u.postsCount, 0);
    const totalFollowers = formattedUsers.reduce((sum, u) => sum + u.followersCount, 0);
    const totalMessages = formattedUsers.reduce((sum, u) => sum + u.messagesCount, 0);
    console.log(`Total Posts: ${totalPosts.toLocaleString()}`);
    console.log(`Total Follower Relationships: ${totalFollowers.toLocaleString()}`);
    console.log(`Total Messages: ${totalMessages.toLocaleString()}`);
    console.log(`Average Posts per User: ${(totalPosts / users.length).toFixed(2)}`);
    console.log(`Average Followers per User: ${(totalFollowers / users.length).toFixed(2)}`);

    // Top users by followers
    console.log(`\n🌟 TOP 5 USERS BY FOLLOWERS\n` + '='.repeat(50));
    const topByFollowers = [...formattedUsers]
      .sort((a, b) => b.followersCount - a.followersCount)
      .slice(0, 5);
    topByFollowers.forEach((user, i) => {
      console.log(`${i + 1}. @${user.username} - ${user.followersCount} followers`);
    });

    // Top users by posts
    console.log(`\n📝 TOP 5 USERS BY POSTS\n` + '='.repeat(50));
    const topByPosts = [...formattedUsers]
      .sort((a, b) => b.postsCount - a.postsCount)
      .slice(0, 5);
    topByPosts.forEach((user, i) => {
      console.log(`${i + 1}. @${user.username} - ${user.postsCount} posts`);
    });

    console.log('\n✅ Export completed successfully!');
    console.log(`📁 Files saved in current directory`);

  } catch (error) {
    console.error('❌ Error exporting users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportUsers();
