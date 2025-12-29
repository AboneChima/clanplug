const { Client } = require('pg');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function addPromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database\n');
    
    const userResult = await client.query(`SELECT id, username FROM users WHERE email = 'abonejoseph@gmail.com'`);
    const user = userResult.rows[0];
    
    console.log('👤 Creating post for:', user.username);

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

    // Use a hosted image URL (you'll need to upload the image somewhere first)
    const imageUrl = 'https://res.cloudinary.com/dws2bgvzj/image/upload/v1735473600/verified-promo.jpg';

    const result = await client.query(`
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
        'Verification Promo',
        $2,
        ARRAY[$3],
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [user.id, caption, imageUrl]);

    console.log('✅ Promo post created!');
    console.log('📝 Post ID:', result.rows[0].id);
    console.log('\n⚠️  Note: Update the image URL in the database with your actual Cloudinary URL');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addPromo();
