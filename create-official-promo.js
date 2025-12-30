const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function createOfficialPromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Connected\n');
    
    // Get abonejoseph user
    const userResult = await client.query(`SELECT id FROM users WHERE email = 'abonejoseph@gmail.com'`);
    const userId = userResult.rows[0].id;

    const caption = `🔥 VERIFICATION PROMO ALERT! 🔥

Get your BLUE VERIFIED BADGE for just ₦2,000! 
(Regular price: ₦5,000)

✅ Stand out with the blue checkmark
✅ Build instant credibility  
✅ Get priority support
✅ Unlock exclusive features
✅ Boost your profile visibility

Limited slots available! Don't miss out! 🚀

Drop a 🔥 if you're getting verified!

#GetVerified #ClanPlugVerified #NigerianCreators #VerifiedBadge #LimitedOffer`;

    // Use a placeholder image URL - you'll need to replace this with actual Cloudinary URL
    const imageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

    await client.query(`
      INSERT INTO posts (
        id,
        "userId",
        type,
        status,
        title,
        description,
        images,
        "isFeatured",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::TEXT,
        $1,
        'SOCIAL_POST',
        'ACTIVE',
        'Official: Verification Promo',
        $2,
        ARRAY[$3],
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [userId, caption, imageUrl]);

    console.log('✅ Official promo post created!');
    console.log('\n⚠️  IMPORTANT: Upload the image and update the post:');
    console.log('1. Upload "verified feature.jpeg" to Cloudinary');
    console.log('2. Get the URL');
    console.log('3. Update the post with the real URL');
    console.log('\nOr just upload via the website - it will auto-upload to Cloudinary!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createOfficialPromo();
