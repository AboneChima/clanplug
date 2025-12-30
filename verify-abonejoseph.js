const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function verifyUser() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check current status
    const checkResult = await client.query(`
      SELECT id, email, "isKYCVerified", "isEmailVerified"
      FROM users 
      WHERE email = 'abonejoseph@gmail.com'
    `);
    
    console.log('Current status:', checkResult.rows[0]);
    
    // Set user as verified
    await client.query(`
      UPDATE users
      SET 
        "isKYCVerified" = true,
        "isEmailVerified" = true,
        status = 'ACTIVE'
      WHERE email = 'abonejoseph@gmail.com'
    `);
    
    console.log('\n✅ User is now fully verified!');
    console.log('   - KYC Verified: true');
    console.log('   - Email Verified: true');
    console.log('   - Status: ACTIVE');
    console.log('\nYou can now post images!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyUser();
