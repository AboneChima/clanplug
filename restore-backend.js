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

async function run() {
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
    
    console.log('Connected\n');
    
    console.log('Checking PM2 status...\n');
    await execCommand('pm2 status');
    
    console.log('\n\nRestoring auth.js from backup...\n');
    await execCommand('cp /var/www/clanplug/backend/dist/utils/auth.js.backup /var/www/clanplug/backend/dist/utils/auth.js');
    
    console.log('\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n\nWaiting 3 seconds for backend to start...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Checking PM2 logs...\n');
    await execCommand('pm2 logs clanplug-backend --lines 20 --nostream');
    
    console.log('\n✅ Backend restored!');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
