const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Contabo database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://clanplug_user:ClanPlugDB2024@176.57.189.248:5432/clanplug'
    }
  }
});

async function restoreDatabase() {
  try {
    console.log('🔗 Connecting to Contabo database...');
    console.log('🌐 Host: 176.57.189.248');
    
    // Find the latest backup
    const backupDir = path.join(__dirname, 'backups');
    const backupFile = 'clanplug_data_2026-06-25_02-09-36.json';
    const backupPath = path.join(backupDir, backupFile);
    
    console.log(`📂 Loading backup: ${backupFile}`);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('\n📊 Backup Summary:');
    console.log(`👥 Users: ${backupData.data.users?.length || 0}`);
    console.log(`📝 Posts: ${backupData.data.posts?.length || 0}`);
    console.log(`💬 Chats: ${backupData.data.chats?.length || 0}`);
    console.log(`💰 Transactions: ${backupData.data.transactions?.length || 0}`);
    console.log(`🔔 Notifications: ${backupData.data.notifications?.length || 0}`);
    console.log(`📱 VTU Transactions: ${backupData.data.vtuTransactions?.length || 0}`);
    
    console.log('\n⚠️  WARNING: This will delete ALL existing data in the Contabo database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  Clearing existing data...');
    
    // Delete in correct order (respecting foreign keys)
    try { await prisma.vTUTransaction?.deleteMany({}); } catch (e) { console.log('⚠️  VTUTransaction table not found, skipping...'); }
    try { await prisma.notification?.deleteMany({}); } catch (e) { console.log('⚠️  Notification table not found, skipping...'); }
    try { await prisma.transaction?.deleteMany({}); } catch (e) { console.log('⚠️  Transaction table not found, skipping...'); }
    try { await prisma.message?.deleteMany({}); } catch (e) { console.log('⚠️  Message table not found, skipping...'); }
    try { await prisma.chat?.deleteMany({}); } catch (e) { console.log('⚠️  Chat table not found, skipping...'); }
    try { await prisma.comment?.deleteMany({}); } catch (e) { console.log('⚠️  Comment table not found, skipping...'); }
    try { await prisma.like?.deleteMany({}); } catch (e) { console.log('⚠️  Like table not found, skipping...'); }
    try { await prisma.bookmark?.deleteMany({}); } catch (e) { console.log('⚠️  Bookmark table not found, skipping...'); }
    try { await prisma.post?.deleteMany({}); } catch (e) { console.log('⚠️  Post table not found, skipping...'); }
    try { await prisma.follow?.deleteMany({}); } catch (e) { console.log('⚠️  Follow table not found, skipping...'); }
    try { await prisma.kYCVerification?.deleteMany({}); } catch (e) { console.log('⚠️  KYCVerification table not found, skipping...'); }
    try { await prisma.adminRole?.deleteMany({}); } catch (e) { console.log('⚠️  AdminRole table not found, skipping...'); }
    try { await prisma.user?.deleteMany({}); } catch (e) { console.log('⚠️  User table not found, skipping...'); }
    
    console.log('✅ Existing data cleared\n');
    
    console.log('📥 Restoring data...\n');
    
    // Restore Users
    if (backupData.data.users?.length > 0) {
      console.log(`👥 Restoring ${backupData.data.users.length} users...`);
      for (const user of backupData.data.users) {
        await prisma.user.create({ data: user });
      }
      console.log('✅ Users restored');
    }
    
    // Restore Admin Roles
    if (backupData.data.adminRoles?.length > 0) {
      console.log(`🔐 Restoring ${backupData.data.adminRoles.length} admin roles...`);
      for (const role of backupData.data.adminRoles) {
        await prisma.adminRole.create({ data: role });
      }
      console.log('✅ Admin roles restored');
    }
    
    // Restore KYC Verifications
    if (backupData.data.kycVerifications?.length > 0) {
      console.log(`🆔 Restoring ${backupData.data.kycVerifications.length} KYC verifications...`);
      for (const kyc of backupData.data.kycVerifications) {
        await prisma.kYCVerification.create({ data: kyc });
      }
      console.log('✅ KYC verifications restored');
    }
    
    // Restore Follows
    if (backupData.data.follows?.length > 0) {
      console.log(`👫 Restoring ${backupData.data.follows.length} follows...`);
      for (const follow of backupData.data.follows) {
        await prisma.follow.create({ data: follow });
      }
      console.log('✅ Follows restored');
    }
    
    // Restore Posts
    if (backupData.data.posts?.length > 0) {
      console.log(`📝 Restoring ${backupData.data.posts.length} posts...`);
      for (const post of backupData.data.posts) {
        await prisma.post.create({ data: post });
      }
      console.log('✅ Posts restored');
    }
    
    // Restore Likes
    if (backupData.data.likes?.length > 0) {
      console.log(`❤️  Restoring ${backupData.data.likes.length} likes...`);
      for (const like of backupData.data.likes) {
        await prisma.like.create({ data: like });
      }
      console.log('✅ Likes restored');
    }
    
    // Restore Comments
    if (backupData.data.comments?.length > 0) {
      console.log(`💬 Restoring ${backupData.data.comments.length} comments...`);
      for (const comment of backupData.data.comments) {
        await prisma.comment.create({ data: comment });
      }
      console.log('✅ Comments restored');
    }
    
    // Restore Bookmarks
    if (backupData.data.bookmarks?.length > 0) {
      console.log(`🔖 Restoring ${backupData.data.bookmarks.length} bookmarks...`);
      for (const bookmark of backupData.data.bookmarks) {
        await prisma.bookmark.create({ data: bookmark });
      }
      console.log('✅ Bookmarks restored');
    }
    
    // Restore Chats
    if (backupData.data.chats?.length > 0) {
      console.log(`💬 Restoring ${backupData.data.chats.length} chats...`);
      for (const chat of backupData.data.chats) {
        await prisma.chat.create({ data: chat });
      }
      console.log('✅ Chats restored');
    }
    
    // Restore Messages
    if (backupData.data.messages?.length > 0) {
      console.log(`✉️  Restoring ${backupData.data.messages.length} messages...`);
      for (const message of backupData.data.messages) {
        await prisma.message.create({ data: message });
      }
      console.log('✅ Messages restored');
    }
    
    // Restore Transactions
    if (backupData.data.transactions?.length > 0) {
      console.log(`💰 Restoring ${backupData.data.transactions.length} transactions...`);
      for (const transaction of backupData.data.transactions) {
        await prisma.transaction.create({ data: transaction });
      }
      console.log('✅ Transactions restored');
    }
    
    // Restore Notifications
    if (backupData.data.notifications?.length > 0) {
      console.log(`🔔 Restoring ${backupData.data.notifications.length} notifications...`);
      for (const notification of backupData.data.notifications) {
        await prisma.notification.create({ data: notification });
      }
      console.log('✅ Notifications restored');
    }
    
    // Restore VTU Transactions
    if (backupData.data.vtuTransactions?.length > 0) {
      console.log(`📱 Restoring ${backupData.data.vtuTransactions.length} VTU transactions...`);
      for (const vtu of backupData.data.vtuTransactions) {
        await prisma.vTUTransaction.create({ data: vtu });
      }
      console.log('✅ VTU transactions restored');
    }
    
    console.log('\n✅ DATABASE RESTORE COMPLETE! 🎉');
    console.log('\n📊 Final Summary:');
    console.log(`✓ ${backupData.data.users?.length || 0} users`);
    console.log(`✓ ${backupData.data.posts?.length || 0} posts`);
    console.log(`✓ ${backupData.data.chats?.length || 0} chats`);
    console.log(`✓ ${backupData.data.messages?.length || 0} messages`);
    console.log(`✓ ${backupData.data.transactions?.length || 0} transactions`);
    console.log(`✓ ${backupData.data.notifications?.length || 0} notifications`);
    console.log(`✓ ${backupData.data.vtuTransactions?.length || 0} VTU transactions`);
    
  } catch (error) {
    console.error('\n❌ Restore failed!');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restore
restoreDatabase();
