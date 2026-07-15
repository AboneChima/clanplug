const { Client } = require('ssh2');
const readline = require('readline');
const fs = require('fs');

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
    
    // Read local script
    const scriptContent = fs.readFileSync('./remove-duplicate-chats.js', 'utf8');
    
    console.log('Uploading deduplication script...\n');
    await execCommand(`cat > /var/www/clanplug/backend/remove-duplicate-chats.js << 'EOFSCRIPT'
${scriptContent}
EOFSCRIPT`);
    
    console.log('\nRunning deduplication script...\n');
    await execCommand('cd /var/www/clanplug/backend && node remove-duplicate-chats.js');
    
    console.log('\n\nDone!');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
