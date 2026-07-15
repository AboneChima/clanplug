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
    
    console.log('Removing issuer and audience from token verification...\n');
    
    // Backup
    await execCommand('cp /var/www/clanplug/backend/dist/utils/auth.js /var/www/clanplug/backend/dist/utils/auth.js.backup');
    
    // Remove issuer and audience from verifyAccessToken
    await execCommand(`sed -i 's/, {$//' /var/www/clanplug/backend/dist/utils/auth.js`);
    await execCommand(`sed -i '/issuer: config_1.default.APP_NAME,/d' /var/www/clanplug/backend/dist/utils/auth.js`);
    await execCommand(`sed -i '/audience: config_1.default.APP_URL,/d' /var/www/clanplug/backend/dist/utils/auth.js`);
    await execCommand(`sed -i 's/config_1.default.JWT_SECRET, })/config_1.default.JWT_SECRET)/g' /var/www/clanplug/backend/dist/utils/auth.js`);
    await execCommand(`sed -i 's/config_1.default.JWT_REFRESH_SECRET, })/config_1.default.JWT_REFRESH_SECRET)/g' /var/www/clanplug/backend/dist/utils/auth.js`);
    
    console.log('\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n✅ Done! Tokens now validate without strict issuer/audience checks.');
    console.log('\nUsers can use their existing tokens.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
