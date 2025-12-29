const { Client } = require('pg');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';
const API_URL = 'https://clanplug.onrender.com';

async function createSpecialPromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Get user
    const userResult = await client.query(`SELECT id FROM users WHERE email = 'abonejoseph@gmail.com'`);
    const userId = userResult.rows[0].id;

    // Upload image to Cloudinary
    console.log('📤 Uploading image to Cloudinary...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('web/public/verified feature.jpeg'));
    formData.append('upload_preset', 'ml_default');
    
    const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dws2bgvzj/image/upload', {
      method: 'POST',
      body: formData
    });
    
    const cloudinaryData = await cloudinaryResponse.json();
    const imageUrl = cloudinaryData.secure_url;
    console.log('✅ Image uploaded:', imageUrl);

    // Create special post
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
        'Verification Promo',
        $2,
        ARRAY[$3],
        true,
        NOW(),
        NOW()
      )
    `, [userId, caption, imageUrl]);

    console.log('✅ Special promo post created!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createSpecialPromo();
