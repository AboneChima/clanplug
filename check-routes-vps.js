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
    
    console.log('Checking backend structure...\n');
    await execCommand('ls -la /var/www/clanplug/backend/');
    
    console.log('\n\nChecking dist structure...\n');
    await execCommand('ls -la /var/www/clanplug/backend/dist/');
    
    console.log('\n\nChecking if group routes exist in dist...\n');
    await execCommand('find /var/www/clanplug/backend/dist -name "*group*" -type f');
    
    console.log('\n\nChecking server.js for group routes...\n');
    await execCommand('grep -i "group" /var/www/clanplug/backend/dist/server.js | head -20');
    
    console.log('\n\nChecking all route registrations in server.js...\n');
    await execCommand('grep -A 2 "app.use.*api" /var/www/clanplug/backend/dist/server.js | head -50');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
