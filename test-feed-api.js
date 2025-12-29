const fetch = require('node-fetch');

async function testFeed() {
  try {
    // Test without auth first
    console.log('🧪 Testing feed API...\n');
    
    const response = await fetch('https://clanplug-o7rp.onrender.com/api/posts/feed', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFeed();
