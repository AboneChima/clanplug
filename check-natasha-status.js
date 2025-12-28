require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkNatasha() {
  try {
    console.log('🔍 Checking Natasha\'s current status...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        username,
        email,
        verification_status,
        verification_expires_at,
        CASE 
          WHEN verification_expires_at IS NULL THEN NULL
          WHEN verification_expires_at > NOW() THEN 
            EXTRACT(DAY FROM (verification_expires_at - NOW()))
          ELSE 0
        END as days_left
      FROM users 
      WHERE email = 'natashanice8717@gmail.com'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = result.rows[0];
    console.log('User Details:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Status:', user.verification_status);
    console.log('Expires:', user.verification_expires_at);
    console.log('Days Left:', user.days_left);
    
    if (user.verification_status === 'none' || !user.verification_status) {
      console.log('\n⚠️ User is NOT verified - status is "none"');
      console.log('Need to verify this user properly!');
    } else {
      console.log('\n✅ User IS verified');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkNatasha();
