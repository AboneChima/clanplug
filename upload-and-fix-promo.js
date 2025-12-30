const { Client } = require('pg');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const DATABASE_URL = 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

async function uploadAndFixPromo() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📤 Uploading image to Cloudinary...\n');
    
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', fs.createReadStream('web/public/verified feature.jpeg'));
    formData.append('upload_preset', 'clanplug');
    formData.append('cloud_name', 'dws2bgvzj');
    
    const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dws2bgvzj/image/upload', {
      method: 'POST',
      body: formData
    });
    
    const cloudinaryData = await cloudinaryResponse.json();
    
    if (!cloudinaryData.secure_url) {
      console.log('❌ Cloudinary upload failed:', cloudinaryData);
      console.log('\n⚠️  Please upload the image manually to Cloudinary');
      console.log('   File: web/public/verified feature.jpeg');
      return;
    }
    
    const imageUrl = cloudinaryData.secure_url;
    console.log('✅ Image uploaded:', imageUrl);
    
    // Update the promo post
    console.log('\n🔧 Updating promo post...');
    await client.query(`
      UPDATE posts
      SET 
        images = ARRAY[$1],
        "isFeatured" = true,
        "createdAt" = NOW()
      WHERE id = 'ccc53a76-ff1b-4d54-a5fb-22936a877a52'
    `, [imageUrl]);
    
    console.log('✅ Promo post updated and pinned to top!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

uploadAndFixPromo();
