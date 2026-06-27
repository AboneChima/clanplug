const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function restoreDatabase() {
  try {
    console.log('🔗 Connecting to Contabo database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Load backup
    const backupFile = 'clanplug_data_2026-06-25_02-09-36.json';
    const backupPath = path.join(__dirname, 'backups', backupFile);
    
    console.log(`📂 Loading backup: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('\n📊 Backup Summary:');
    console.log(`👥 Users: ${backupData.data.users?.length || 0}`);
    console.log(`📝 Posts: ${backupData.data.posts?.length || 0}`);
    console.log(`💬 Chats: ${backupData.data.chats?.length || 0}`);
    console.log(`💰 Transactions: ${backupData.data.transactions?.length || 0}`);
    console.log(`🔔 Notifications: ${backupData.data.notifications?.length || 0}`);
    
    console.log('\n⚠️  WARNING: This will delete ALL existing data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  Clearing existing data...');
    
    // Get list of all tables
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `);
    
    const tables = tablesResult.rows.map(r => `"${r.tablename}"`).join(', ');
    
    if (tables) {
      console.log(`Clearing tables: ${tables}`);
      await client.query(`TRUNCATE TABLE ${tables} CASCADE`);
      console.log('✅ Data cleared\n');
    } else {
      console.log('⚠️  No tables found to clear\n');
    }
    
    console.log('📥 Restoring data...\n');
    
    // Restore Users (without nested relations)
    if (backupData.data.users?.length > 0) {
      console.log(`👥 Restoring ${backupData.data.users.length} users...`);
      
      // Valid columns in Contabo database
      const validColumns = [
        'id', 'email', 'phone', 'username', 'firstName', 'lastName', 'avatar', 'bio',
        'dateOfBirth', 'gender', 'country', 'state', 'city', 'address', 'role', 'status',
        'isEmailVerified', 'isPhoneVerified', 'isKYCVerified', 'passwordHash', 'lastLoginAt',
        'loginAttempts', 'lockedUntil', 'twoFactorEnabled', 'twoFactorSecret', 'referralCode',
        'referredBy', 'totalReferrals', 'createdAt', 'updatedAt', 'emailVerifiedAt',
        'resetToken', 'resetTokenExpiry', 'verificationToken', 'ngnWalletAddress', 'usdtWalletAddress'
      ];
      
      for (const user of backupData.data.users) {
        // Remove nested fields and invalid columns
        const { wallets, kycVerifications, verificationBadge, usernameChangedAt, emailChangedAt, fcmTokens, ...userData } = user;
        
        // Filter to only valid columns
        const filteredData = {};
        for (const col of validColumns) {
          if (userData.hasOwnProperty(col)) {
            filteredData[col] = userData[col];
          }
        }
        
        const columns = Object.keys(filteredData).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredData).map(v => v === undefined ? null : v);
        
        try {
          await client.query(
            `INSERT INTO users (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped user ${user.id}: ${err.message}`);
        }
      }
      console.log('✅ Users restored');
    }
    
    // Restore Wallets separately
    if (backupData.data.users?.length > 0) {
      console.log(`💰 Restoring wallets...`);
      let walletCount = 0;
      for (const user of backupData.data.users) {
        if (user.wallets?.length > 0) {
          for (const wallet of user.wallets) {
            const columns = Object.keys(wallet).map(k => `"${k}"`).join(', ');
            const placeholders = Object.keys(wallet).map((_, i) => `$${i + 1}`).join(', ');
            const values = Object.values(wallet).map(v => v === undefined ? null : v);
            
            await client.query(
              `INSERT INTO wallets (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
              values
            );
            walletCount++;
          }
        }
      }
      console.log(`✅ ${walletCount} wallets restored`);
    }
    
    // Restore Follows
    if (backupData.data.follows?.length > 0) {
      console.log(`👫 Restoring ${backupData.data.follows.length} follows...`);
      for (const follow of backupData.data.follows) {
        const columns = Object.keys(follow).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(follow).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(follow).map(v => v === undefined ? null : v);
        
        await client.query(
          `INSERT INTO follows (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        );
      }
      console.log('✅ Follows restored');
    }
    
    // Restore Posts
    if (backupData.data.posts?.length > 0) {
      console.log(`📝 Restoring ${backupData.data.posts.length} posts...`);
      
      // Valid columns in posts table
      const validColumns = [
        'id', 'userId', 'type', 'status', 'title', 'description', 'price', 'currency',
        'images', 'videos', 'tags', 'category', 'gameTitle', 'platform', 'accountLevel',
        'accountDetails', 'location', 'isNegotiable', 'isFeatured', 'viewCount',
        'likeCount', 'commentCount', 'shareCount', 'soldAt', 'expiresAt', 'createdAt',
        'updatedAt', 'accountAge', 'accountRank', 'accountRegion', 'gameId',
        'hasRareItems', 'isVerified'
      ];
      
      for (const post of backupData.data.posts) {
        // Filter to only valid columns
        const filteredData = {};
        for (const col of validColumns) {
          if (post.hasOwnProperty(col)) {
            filteredData[col] = post[col];
          }
        }
        
        const columns = Object.keys(filteredData).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredData).map(v => v === undefined ? null : v);
        
        try {
          await client.query(
            `INSERT INTO posts (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped post ${post.id}: ${err.message}`);
        }
      }
      console.log('✅ Posts restored');
    }
    
    // Restore Chats
    if (backupData.data.chats?.length > 0) {
      console.log(`💬 Restoring ${backupData.data.chats.length} chats...`);
      
      // Valid columns in chats table
      const validColumns = [
        'id', 'type', 'name', 'description', 'avatar', 'isActive',
        'lastMessageAt', 'createdAt', 'updatedAt'
      ];
      
      for (const chat of backupData.data.chats) {
        // Filter to only valid columns (remove participants array)
        const filteredData = {};
        for (const col of validColumns) {
          if (chat.hasOwnProperty(col)) {
            filteredData[col] = chat[col];
          }
        }
        
        const columns = Object.keys(filteredData).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredData).map(v => v === undefined ? null : v);
        
        try {
          await client.query(
            `INSERT INTO chats (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped chat ${chat.id}: ${err.message}`);
        }
      }
      console.log('✅ Chats restored');
    }
    
    // Restore Chat Participants (if they exist in backup)
    if (backupData.data.chats?.length > 0) {
      console.log(`👥 Restoring chat participants...`);
      let participantCount = 0;
      for (const chat of backupData.data.chats) {
        if (chat.participants && Array.isArray(chat.participants)) {
          for (const userId of chat.participants) {
            try {
              await client.query(
                `INSERT INTO chat_participants ("chatId", "userId", "joinedAt") VALUES ($1, $2, $3) ON CONFLICT ("chatId", "userId") DO NOTHING`,
                [chat.id, userId, chat.createdAt || new Date().toISOString()]
              );
              participantCount++;
            } catch (err) {
              // Ignore errors for participants
            }
          }
        }
      }
      console.log(`✅ ${participantCount} chat participants restored`);
    }
    
    // Restore Messages (to chat_messages table)
    if (backupData.data.messages?.length > 0) {
      console.log(`✉️  Restoring ${backupData.data.messages.length} messages...`);
      for (const message of backupData.data.messages) {
        try {
          // Get columns dynamically from the message object
          const columns = Object.keys(message).filter(k => k !== 'chat' && k !== 'sender').map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(message).filter(k => k !== 'chat' && k !== 'sender').map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(message).filter((_, i) => {
            const keys = Object.keys(message);
            return keys[i] !== 'chat' && keys[i] !== 'sender';
          }).map(v => v === undefined ? null : v);
          
          await client.query(
            `INSERT INTO chat_messages (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped message ${message.id}: ${err.message}`);
        }
      }
      console.log('✅ Messages restored');
    }
    
    // Restore Transactions
    if (backupData.data.transactions?.length > 0) {
      console.log(`💰 Restoring ${backupData.data.transactions.length} transactions...`);
      
      // Valid columns in transactions table  
      const validColumns = [
        'id', 'userId', 'walletId', 'type', 'status', 'amount', 'fee', 'netAmount',
        'currency', 'reference', 'description', 'metadata', 'gatewayResponse',
        'failureReason', 'processedAt', 'createdAt', 'updatedAt'
      ];
      
      for (const transaction of backupData.data.transactions) {
        // Filter to only valid columns
        const filteredData = {};
        for (const col of validColumns) {
          if (transaction.hasOwnProperty(col)) {
            filteredData[col] = transaction[col];
          }
        }
        
        const columns = Object.keys(filteredData).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredData).map(v => v === undefined ? null : v);
        
        try {
          await client.query(
            `INSERT INTO transactions (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped transaction ${transaction.id}: ${err.message}`);
        }
      }
      console.log('✅ Transactions restored');
    }
    
    // Restore Notifications
    if (backupData.data.notifications?.length > 0) {
      console.log(`🔔 Restoring ${backupData.data.notifications.length} notifications...`);
      
      // Valid columns in notifications table
      const validColumns = [
        'id', 'userId', 'type', 'title', 'message', 'data',
        'isRead', 'readAt', 'createdAt'
      ];
      
      for (const notification of backupData.data.notifications) {
        // Filter to only valid columns
        const filteredData = {};
        for (const col of validColumns) {
          if (notification.hasOwnProperty(col)) {
            filteredData[col] = notification[col];
          }
        }
        
        const columns = Object.keys(filteredData).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredData).map(v => v === undefined ? null : v);
        
        try {
          await client.query(
            `INSERT INTO notifications (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            values
          );
        } catch (err) {
          console.log(`⚠️  Skipped notification ${notification.id}: ${err.message}`);
        }
      }
      console.log('✅ Notifications restored');
    }
    
    console.log('\n✅ DATABASE RESTORE COMPLETE! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ Restore failed!');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

restoreDatabase();
