// Quick test script to verify Supabase Storage connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'uploads';

console.log('🔍 Testing Supabase Storage Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Bucket:', bucketName);
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: List buckets
    console.log('\n📦 Test 1: Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Found buckets:', buckets.map(b => b.name).join(', '));
    
    // Check if our bucket exists
    const bucketExists = buckets.some(b => b.name === bucketName);
    if (!bucketExists) {
      console.log(`\n⚠️  Bucket "${bucketName}" does not exist yet!`);
      console.log('📝 Please create it in Supabase Dashboard:');
      console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/storage/buckets`);
      console.log('\n   Steps:');
      console.log('   1. Click "New bucket"');
      console.log(`   2. Name it "${bucketName}"`);
      console.log('   3. Enable "Public bucket"');
      console.log('   4. Set file size limit to 50 MB');
      console.log('   5. Click "Create bucket"');
      return;
    }
    
    console.log(`✅ Bucket "${bucketName}" exists!`);
    
    // Test 2: Try to upload a test file
    console.log('\n📤 Test 2: Testing file upload...');
    const testContent = Buffer.from('Test file from Lordmoon backend');
    const testFileName = `test/${Date.now()}-test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.log('\n💡 Common issues:');
      console.log('   - Bucket is not public');
      console.log('   - Missing storage policies');
      console.log('   - Service role key is incorrect');
      return;
    }
    
    console.log('✅ Upload successful!');
    
    // Test 3: Get public URL
    console.log('\n🔗 Test 3: Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
    
    console.log('✅ Public URL:', publicUrl);
    
    // Test 4: Clean up test file
    console.log('\n🧹 Test 4: Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file deleted');
    }
    
    console.log('\n✨ All tests passed! Supabase Storage is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

testConnection();
