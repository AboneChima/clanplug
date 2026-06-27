const { Client } = require('pg');

const client = new Client({
  host: '176.57.189.248',
  port: 5432,
  database: 'clanplug',
  user: 'clanplug_user',
  password: 'ClanPlugDB2024'
});

async function verifyBadges() {
  try {
    await client.connect();
    
    // Check KYC verified users
    const kycResult = await client.query(`
      SELECT COUNT(*) 
      FROM users 
      WHERE "isKYCVerified" = true
    `);
    console.log(`👤 KYC Verified Users: ${kycResult.rows[0].count}`);
    
    // Check verification badges
    const badgeResult = await client.query(`
      SELECT COUNT(*) 
      FROM verification_badges
    `);
    console.log(`🏅 Verification Badges: ${badgeResult.rows[0].count}`);
    
    // Sample user with badge
    const sampleResult = await client.query(`
      SELECT u.username, u."isKYCVerified", 
             vb.status, vb."purchasedAt"
      FROM users u
      LEFT JOIN verification_badges vb ON u.id = vb."userId"
      WHERE u."isKYCVerified" = true
      LIMIT 3
    `);
    
    console.log('\n📝 Sample verified users:');
    sampleResult.rows.forEach((user, i) => {
      console.log(`   ${i + 1}. @${user.username}`);
      console.log(`      KYC: ${user.isKYCVerified}`);
      console.log(`      Badge Status: ${user.status || 'N/A'}`);
      console.log(`      Purchased: ${user.purchasedAt || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyBadges();
