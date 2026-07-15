const { Client } = require('ssh2');
const fs = require('fs');
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
    
    // Read local auth.ts file
    const authContent = fs.readFileSync('src/utils/auth.ts', 'utf8');
    
    // Escape content for heredoc
    const escapedContent = authContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    console.log('Uploading auth.ts...\n');
    await execCommand(`cat > /var/www/clanplug/backend/src/utils/auth.ts << 'EOFAUTH'
${authContent}
EOFAUTH`);
    
    console.log('\nRebuilding backend...\n');
    await execCommand('cd /var/www/clanplug/backend && npm run build');
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n✅ Deployment complete!');
    console.log('\nOld tokens will now work. Users don\'t need to log out.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
