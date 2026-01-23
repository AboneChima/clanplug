// Script to delete user ogechui26@gmail.com from database
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function deleteUser() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Find the user
    const userResult = await client.query(
      'SELECT id, email, username FROM users WHERE email = $1',
      ['ogechui26@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User ogechui26@gmail.com not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`📝 Found user: ${userResult.rows[0].username} (${userResult.rows[0].email})`);
    console.log(`🆔 User ID: ${userId}`);
    console.log('');
    console.log('🗑️  Starting deletion process...');

    // Delete in order to respect foreign key constraints
    
    // 1. VTU transactions
    try {
      const vtu = await client.query('DELETE FROM vtu_transactions WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${vtu.rowCount} VTU transactions`);
    } catch (e) {
      console.log(`⚠️  VTU transactions: ${e.message}`);
    }

    // 2. Transactions
    try {
      const trans = await client.query('DELETE FROM transactions WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${trans.rowCount} transactions`);
    } catch (e) {
      console.log(`⚠️  Transactions: ${e.message}`);
    }

    // 3. Wallets
    try {
      const wallets = await client.query('DELETE FROM wallets WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${wallets.rowCount} wallets`);
    } catch (e) {
      console.log(`⚠️  Wallets: ${e.message}`);
    }

    // 4. Notifications
    try {
      const notifs = await client.query('DELETE FROM notifications WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${notifs.rowCount} notifications`);
    } catch (e) {
      console.log(`⚠️  Notifications: ${e.message}`);
    }

    // 5. KYC verifications
    try {
      const kyc = await client.query('DELETE FROM kyc_verifications WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${kyc.rowCount} KYC verifications`);
    } catch (e) {
      console.log(`⚠️  KYC: ${e.message}`);
    }

    // 6. Verification badge
    try {
      const badge = await client.query('DELETE FROM verification_badges WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${badge.rowCount} verification badges`);
    } catch (e) {
      console.log(`⚠️  Badges: ${e.message}`);
    }

    // 7. Likes
    try {
      const likes = await client.query('DELETE FROM likes WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${likes.rowCount} likes`);
    } catch (e) {
      console.log(`⚠️  Likes: ${e.message}`);
    }

    // 8. Comments
    try {
      const comments = await client.query('DELETE FROM comments WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${comments.rowCount} comments`);
    } catch (e) {
      console.log(`⚠️  Comments: ${e.message}`);
    }

    // 9. Bookmarks
    try {
      const bookmarks = await client.query('DELETE FROM bookmarks WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${bookmarks.rowCount} bookmarks`);
    } catch (e) {
      console.log(`⚠️  Bookmarks: ${e.message}`);
    }

    // 10. Posts
    try {
      const posts = await client.query('DELETE FROM posts WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${posts.rowCount} posts`);
    } catch (e) {
      console.log(`⚠️  Posts: ${e.message}`);
    }

    // 11. Follows
    try {
      const follows = await client.query('DELETE FROM follows WHERE "followerId" = $1 OR "followingId" = $1', [userId]);
      console.log(`✅ Deleted ${follows.rowCount} follows`);
    } catch (e) {
      console.log(`⚠️  Follows: ${e.message}`);
    }

    // 12. Chat messages
    try {
      const messages = await client.query('DELETE FROM chat_messages WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${messages.rowCount} chat messages`);
    } catch (e) {
      console.log(`⚠️  Chat messages: ${e.message}`);
    }

    // 13. Chat participants
    try {
      const participants = await client.query('DELETE FROM chat_participants WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${participants.rowCount} chat participants`);
    } catch (e) {
      console.log(`⚠️  Chat participants: ${e.message}`);
    }

    // 14. Escrow messages
    try {
      const escrowMsgs = await client.query('DELETE FROM escrow_messages WHERE "senderId" = $1', [userId]);
      console.log(`✅ Deleted ${escrowMsgs.rowCount} escrow messages`);
    } catch (e) {
      console.log(`⚠️  Escrow messages: ${e.message}`);
    }

    // 15. Escrows
    try {
      const escrows = await client.query('DELETE FROM escrows WHERE "buyerId" = $1 OR "sellerId" = $1', [userId]);
      console.log(`✅ Deleted ${escrows.rowCount} escrows`);
    } catch (e) {
      console.log(`⚠️  Escrows: ${e.message}`);
    }

    // 16. Purchase requests
    try {
      const requests = await client.query('DELETE FROM purchase_requests WHERE "buyerId" = $1 OR "sellerId" = $1', [userId]);
      console.log(`✅ Deleted ${requests.rowCount} purchase requests`);
    } catch (e) {
      console.log(`⚠️  Purchase requests: ${e.message}`);
    }

    // 17. Listings
    try {
      const listings = await client.query('DELETE FROM listings WHERE "sellerId" = $1', [userId]);
      console.log(`✅ Deleted ${listings.rowCount} listings`);
    } catch (e) {
      console.log(`⚠️  Listings: ${e.message}`);
    }

    // 18. Purchases
    try {
      const purchases = await client.query('DELETE FROM purchases WHERE "buyerId" = $1 OR "sellerId" = $1', [userId]);
      console.log(`✅ Deleted ${purchases.rowCount} purchases`);
    } catch (e) {
      console.log(`⚠️  Purchases: ${e.message}`);
    }

    // 19. Reports
    try {
      const reports = await client.query('DELETE FROM reports WHERE "reporterId" = $1 OR "reportedUserId" = $1', [userId]);
      console.log(`✅ Deleted ${reports.rowCount} reports`);
    } catch (e) {
      console.log(`⚠️  Reports: ${e.message}`);
    }

    // 20. Stories
    try {
      const stories = await client.query('DELETE FROM stories WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${stories.rowCount} stories`);
    } catch (e) {
      console.log(`⚠️  Stories: ${e.message}`);
    }

    // 21. Story views
    try {
      const views = await client.query('DELETE FROM story_views WHERE "userId" = $1', [userId]);
      console.log(`✅ Deleted ${views.rowCount} story views`);
    } catch (e) {
      console.log(`⚠️  Story views: ${e.message}`);
    }

    // Finally, delete the user
    const userDelete = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`✅ Deleted user account`);

    console.log('');
    console.log('🎉 User ogechui26@gmail.com deleted successfully!');

    // Verify deletion
    const verify = await client.query('SELECT COUNT(*) FROM users WHERE email = $1', ['ogechui26@gmail.com']);
    console.log(`✅ Verification: ${verify.rows[0].count} users with that email remaining (should be 0)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

deleteUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
