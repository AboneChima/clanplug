const { Pool } = require('pg');

// Use Render production database
const pool = new Pool({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: { rejectUnauthorized: false }
});

async function verifyDeoracle() {
  try {
    console.log('✅ Connected to production database\n');
    
    // Find user
    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE email = 'abonejoseph@gmail.com'`
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      await pool.end();
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.username} (${user.email})`);
    
    // Set verification for 5015 years (like LORDMOON)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (5015 * 365 * 24 * 60 * 60 * 1000));
    
    // Generate a unique ID for the badge
    const badgeId = `vb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Upsert verification badge with 'active' status
    await pool.query(`
      INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      VALUES ($1, $2, 'active', $3, $4, $3, $3)
      ON CONFLICT ("userId") 
      DO UPDATE SET 
        status = 'active',
        "purchasedAt" = $3,
        "expiresAt" = $4,
        "updatedAt" = $3
    `, [badgeId, user.id, now, expiresAt]);
    
    console.log('\n✅ Deoracle verified successfully!');
    console.log('Status: active');
    console.log('Expires:', expiresAt.toLocaleDateString());
    console.log('Days: 5015 years\n');
    
    // Send notification
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await pool.query(`
      INSERT INTO notifications (id, "userId", type, title, message, "createdAt")
      VALUES ($1, $2, 'SYSTEM', 'Verification Badge Activated', 'Your verification badge has been activated for 5015 years! You now have access to premium features.', NOW())
    `, [notifId, user.id]);
    
    console.log('✅ Notification sent to user\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyDeoracle();
