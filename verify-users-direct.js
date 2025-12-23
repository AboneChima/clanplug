const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Verify Franklynnnamdi136@gmail.com for 15 years
    console.log('\n📧 Verifying Franklynnnamdi136@gmail.com for 15 years...');
    const result1 = await client.query(`
      INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(),
        u.id,
        'active',
        NOW(),
        NOW() + INTERVAL '15 years',
        NOW(),
        NOW()
      FROM users u
      WHERE LOWER(u.email) = 'franklynnnamdi136@gmail.com'
      ON CONFLICT ("userId") 
      DO UPDATE SET
        status = 'active',
        "purchasedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '15 years',
        "updatedAt" = NOW()
      RETURNING *;
    `);
    console.log('✅ Badge created/updated for Franklynnnamdi136@gmail.com');

    // Verify abonejoseph@gmail.com for 15 years
    console.log('\n📧 Verifying abonejoseph@gmail.com for 15 years...');
    const result2 = await client.query(`
      INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      SELECT 
        gen_random_uuid(),
        u.id,
        'active',
        NOW(),
        NOW() + INTERVAL '15 years',
        NOW(),
        NOW()
      FROM users u
      WHERE LOWER(u.email) = 'abonejoseph@gmail.com'
      ON CONFLICT ("userId") 
      DO UPDATE SET
        status = 'active',
        "purchasedAt" = NOW(),
        "expiresAt" = NOW() + INTERVAL '15 years',
        "updatedAt" = NOW()
      RETURNING *;
    `);
    console.log('✅ Badge created/updated for abonejoseph@gmail.com');

    // Verify the badges
    console.log('\n🔍 Checking verification badges...');
    const verification = await client.query(`
      SELECT 
        u.email,
        u.username,
        u."firstName",
        u."lastName",
        vb.status,
        vb."expiresAt"
      FROM users u
      JOIN verification_badges vb ON vb."userId" = u.id
      WHERE LOWER(u.email) IN ('franklynnnamdi136@gmail.com', 'abonejoseph@gmail.com')
      ORDER BY u.email;
    `);

    console.log('\n✅ Verification Complete!\n');
    console.table(verification.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyUsers();
