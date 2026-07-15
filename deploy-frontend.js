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

function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📌 ${description}...`);
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
        if (code !== 0) {
          console.log(`\n⚠️  Command exited with code ${code}`);
        } else {
          console.log(`✅ Done`);
        }
        resolve(output);
      });
    });
  });
}

async function deploy() {
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
    
    console.log('✅ Connected\n');
    
    // Create tarball locally first
    console.log('📦 Creating frontend tarball locally...');
    const { execSync } = require('child_process');
    execSync('cd web && tar -czf ../frontend.tar.gz .next package.json package-lock.json', { stdio: 'inherit' });
    
    // Upload tarball
    console.log('\n📤 Uploading frontend...');
    await new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        
        const fs = require('fs');
        const readStream = fs.createReadStream('frontend.tar.gz');
        const writeStream = sftp.createWriteStream('/var/www/clanplug/frontend.tar.gz');
        
        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
      });
    });
    console.log('✅ Upload complete\n');
    
    // Extract on VPS
    await execCommand(
      'cd /var/www/clanplug/frontend && tar -xzf ../frontend.tar.gz && rm ../frontend.tar.gz',
      'Extracting frontend'
    );
    
    // Restart frontend
    await execCommand(
      'pm2 restart clanplug-frontend',
      'Restarting frontend'
    );
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check status
    await execCommand(
      'pm2 list',
      'Checking PM2 status'
    );
    
    console.log('\n✅ Frontend deployed!');
    console.log('\n🌐 Test at: https://www.clanplug.site');
    console.log('📋 Check console for improved error messages');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

deploy();
