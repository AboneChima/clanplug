const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyUser() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(`
      INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(),
        u.id,
        'active',
        NOW(),
        NOW() + INTERVAL '60 days',
        NOW(),
        NOW()
      FROM users u
      WHERE LOWER(u.email) = 'dmaileizzy@gmail.com'
      ON CONFLICT ("userId") 
      DO UPDATE SET
        status = 'active',
        "purchasedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '60 days',
        "updatedAt" = NOW()
      RETURNING *;
    `);

    if (result.rows.length > 0) {
      console.log('✅ User verified for 60 days!');
      console.log('Email: Dmaileizzy@gmail.com');
      console.log('Expires:', result.rows[0].expiresAt);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyUser();
