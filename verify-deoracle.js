require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyDeoracle() {
  try {
    console.log('✅ Connected to database\n');
    
    // Find user
    const userResult = await pool.query(
      `SELECT id, username, email FROM users WHERE email = 'abonejoseph@gmail.com'`
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.username} (${user.email})`);
    
    // Set verification for 5015 years (like LORDMOON)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (5015 * 365 * 24 * 60 * 60 * 1000));
    
    // Upsert verification badge with 'active' status
    await pool.query(`
      INSERT INTO "VerificationBadge" ("userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      VALUES ($1, 'active', $2, $3, $2, $2)
      ON CONFLICT ("userId") 
      DO UPDATE SET 
        status = 'active',
        "purchasedAt" = $2,
        "expiresAt" = $3,
        "updatedAt" = $2
    `, [user.id, now, expiresAt]);
    
    console.log('\n✅ Deoracle verified successfully!');
    console.log('Status: active');
    console.log('Expires:', expiresAt.toLocaleDateString());
    console.log('Days: 5015 years\n');
    
    // Send notification
    await pool.query(`
      INSERT INTO notifications ("userId", type, title, message, "createdAt", "updatedAt")
      VALUES ($1, 'SYSTEM', 'Verification Badge Activated', 'Your verification badge has been activated for 5015 years! You now have access to premium features.', NOW(), NOW())
    `, [user.id]);
    
    console.log('✅ Notification sent to user\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDeoracle();
