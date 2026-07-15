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
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
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

async function checkStatus() {
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
    
    // Check if .env exists
    console.log('🔍 Checking .env file...\n');
    await execCommand('ls -la /var/www/clanplug/backend/.env');
    
    // Check error logs
    console.log('\n\n📋 Backend error logs:\n');
    await execCommand('pm2 logs clanplug-backend --err --lines 20 --nostream');
    
    // Try to copy .env from backup
    console.log('\n\n📋 Looking for backup .env...\n');
    await execCommand('ls -la /var/www/clanplug/backend_backup*/.env 2>&1 | head -n 3');
    
    console.log('\n\n🔧 Copying .env from most recent backup...\n');
    await execCommand('cp $(ls -t /var/www/clanplug/backend_backup*/.env 2>/dev/null | head -n 1) /var/www/clanplug/backend/.env 2>&1 || echo "No backup found"');
    
    // Restart
    console.log('\n🔄 Restarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n⏳ Waiting 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check logs again
    console.log('📋 New logs:\n');
    await execCommand('pm2 logs clanplug-backend --lines 30 --nostream');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

checkStatus();
