const { Client } = require('pg');

const connectionString = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon?sslmode=require';

async function verifyNatasha() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Verify Natasha for 60 days
    const result = await client.query(`
      INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
      SELECT 
          gen_random_uuid(),
          id,
          'verified',
          NOW(),
          NOW() + INTERVAL '60 days',
          NOW(),
          NOW()
      FROM users 
      WHERE LOWER(email) = 'natashanice8717@gmail.com'
      ON CONFLICT ("userId") 
      DO UPDATE SET
          status = 'verified',
          "purchasedAt" = NOW(),
          "expiresAt" = NOW() + INTERVAL '60 days',
          "updatedAt" = NOW()
      RETURNING *;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Natasha verified successfully!');
      console.log('Status:', result.rows[0].status);
      console.log('Expires:', new Date(result.rows[0].expiresAt).toLocaleDateString());
      console.log('Days: 60\n');
    } else {
      console.log('❌ User not found or update failed');
    }
    
    // Create notification
    await client.query(`
      INSERT INTO notifications (id, "userId", type, title, message, "isRead", "createdAt")
      SELECT 
          gen_random_uuid(),
          id,
          'SYSTEM',
          '✅ Verification Badge Activated!',
          'Congratulations! Your verification badge is now active for 60 days.',
          false,
          NOW()
      FROM users 
      WHERE LOWER(email) = 'natashanice8717@gmail.com';
    `);
    
    console.log('✅ Notification sent to user');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyNatasha();
