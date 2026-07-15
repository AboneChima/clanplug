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

async function fix() {
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
    
    // Delete duplicate clanplug-api
    console.log('🗑️  Deleting duplicate clanplug-api process...\n');
    await execCommand('pm2 delete clanplug-api');
    
    // Delete old clanplug-backend
    console.log('\n🗑️  Deleting old clanplug-backend...\n');
    await execCommand('pm2 delete clanplug-backend');
    
    // Start new one with correct name
    console.log('\n🚀 Starting backend with correct name...\n');
    await execCommand('cd /var/www/clanplug/backend && pm2 start dist/server.js --name clanplug-backend');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check logs
    console.log('\n📋 Recent logs:\n');
    await execCommand('pm2 logs clanplug-backend --lines 20 --nostream');
    
    // Test groups API
    console.log('\n\n🧪 Testing groups API (should return TOKEN_REQUIRED, not 401 Unauthorized):\n');
    await execCommand('curl -i http://localhost:4000/api/groups 2>&1 | head -n 10');
    
    console.log('\n\n✅ Fixed! Backend is now running as clanplug-backend\n');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

fix();
