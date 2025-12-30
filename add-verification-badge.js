const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function addBadge() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const userResult = await client.query(`SELECT id FROM users WHERE email = 'abonejoseph@gmail.com'`);
    const userId = userResult.rows[0].id;
    
    // Check if badge exists
    const badgeCheck = await client.query(`SELECT * FROM verification_badges WHERE "userId" = $1`, [userId]);
    
    if (badgeCheck.rows.length > 0) {
      console.log('Badge exists, updating...');
      await client.query(`
        UPDATE verification_badges
        SET 
          status = 'active',
          "expiresAt" = NOW() + INTERVAL '365 days',
          "updatedAt" = NOW()
        WHERE "userId" = $1
      `, [userId]);
    } else {
      console.log('Creating new badge...');
      await client.query(`
        INSERT INTO verification_badges (
          id,
          "userId",
          status,
          "verifiedAt",
          "expiresAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid()::TEXT,
          $1,
          'active',
          NOW(),
          NOW() + INTERVAL '365 days',
          NOW(),
          NOW()
        )
      `, [userId]);
    }
    
    console.log('✅ Verification badge added!');
    console.log('   Status: active');
    console.log('   Expires: 1 year from now');
    console.log('\nYou can now post images! Refresh the page.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addBadge();
