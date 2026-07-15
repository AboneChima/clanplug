const { Client } = require('ssh2');
const { SFTPWrapper } = require('ssh2');
const fs = require('fs');
const path = require('path');
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

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
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
      stream.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`Command failed with code ${code}`));
      });
    });
  });
}

async function run() {
  try {
    const password = await askPassword();
    rl.close();
    
    console.log('\nConnecting to VPS...\n');
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect({
        host: '176.57.189.248',
        port: 22,
        username: 'root',
        password: password
      });
    });
    
    console.log('Connected!\n');
    
    // Upload auth.ts file
    console.log('Uploading auth.ts...\n');
    const sftp = await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) reject(err);
        else resolve(sftp);
      });
    });
    
    await uploadFile(
      sftp,
      path.join(__dirname, 'src', 'utils', 'auth.ts'),
      '/var/www/clanplug/backend/src/utils/auth.ts'
    );
    console.log('✅ Uploaded auth.ts\n');
    
    // Rebuild backend
    console.log('Rebuilding backend...\n');
    await execCommand('cd /var/www/clanplug/backend && npm run build');
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n✅ Deployment complete!\n');
    console.log('Old tokens will now work without requiring users to log out.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
