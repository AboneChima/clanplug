const { Client } = require('ssh2');
const readline = require('readline');

const conn = new Client();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter VPS password: ', (password) => {
      resolve(password);
    });
  });
}

function execCommand(command) {
  return new Promise((resolve) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error('Error:', err.message);
        resolve('');
        return;
      }
      
      let output = '';
      stream.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
      stream.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      stream.on('close', () => resolve(output));
    });
  });
}

async function test() {
  try {
    const password = await askPassword();
    rl.close();
    
    console.log('\nConnecting...\n');
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect({
        host: '176.57.189.248',
        port: 22,
        username: 'root',
        password: password
      });
    });
    
    console.log('✅ Connected\n');
    
    console.log('Waiting 10 seconds for backend to fully start...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check PM2 status
    console.log('📋 PM2 Status:\n');
    await execCommand('pm2 list');
    
    // Check logs
    console.log('\n\n📋 Recent logs:\n');
    await execCommand('pm2 logs clanplug-backend --lines 30 --nostream');
    
    // Test groups API without auth
    console.log('\n\n🧪 Test 1: Groups API without token (should return TOKEN_REQUIRED):\n');
    await execCommand('curl -i http://localhost:4000/api/groups 2>&1 | head -n 15');
    
    // Test with fake token
    console.log('\n\n🧪 Test 2: Groups API with fake token (should return TOKEN_INVALID):\n');
    await execCommand('curl -i http://localhost:4000/api/groups -H "Authorization: Bearer faketoken" 2>&1 | head -n 15');
    
    console.log('\n\n✅ Tests complete! Now test with real token from the browser.');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

test();
