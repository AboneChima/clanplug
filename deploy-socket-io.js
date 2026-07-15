const { Client } = require('ssh2');
const fs = require('fs');
const readline = require('readline');

const VPS_HOST = '176.57.189.248';
const VPS_USER = 'root';

console.log('🚀 Deploying Socket.IO backend to VPS...\n');

// Create readline interface for password input
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

const conn = new Client();

function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📌 ${description}...`);
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error(`❌ Error: ${err.message}`);
        reject(err);
        return;
      }
      
      let output = '';
      let errorOutput = '';
      
      stream.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });
      
      stream.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
      
      stream.on('close', (code) => {
        if (code !== 0) {
          console.error(`\n❌ Command failed with code ${code}`);
          if (errorOutput) console.error(errorOutput);
          reject(new Error(`Command failed with code ${code}`));
        } else {
          console.log(`✅ Done`);
          resolve({ output, errorOutput });
        }
      });
    });
  });
}

function uploadFile(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📤 Uploading ${localPath} to ${remotePath}...`);
    
    conn.sftp((err, sftp) => {
      if (err) {
        console.error(`❌ SFTP error: ${err.message}`);
        reject(err);
        return;
      }
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      writeStream.on('close', () => {
        console.log('✅ Upload complete');
        resolve();
      });
      
      writeStream.on('error', (err) => {
        console.error(`❌ Upload error: ${err.message}`);
        reject(err);
      });
      
      readStream.pipe(writeStream);
    });
  });
}

async function deploy() {
  try {
    // Check if backend.tar.gz exists
    if (!fs.existsSync('backend.tar.gz')) {
      console.error('❌ backend.tar.gz not found! Run rebuild.ps1 first.');
      rl.close();
      process.exit(1);
    }
    
    const password = await askPassword();
    rl.close();
    
    console.log('\nConnecting to VPS...');
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log('✅ SSH connection established\n');
        resolve();
      }).on('error', (err) => {
        console.error('❌ SSH connection error:', err.message);
        reject(err);
      }).connect({
        host: VPS_HOST,
        port: 22,
        username: VPS_USER,
        password: password
      });
    });
    
    // Backup current backend
    await execCommand(
      'cd /var/www/clanplug && [ -d backend ] && mv backend backend_backup_$(date +%Y%m%d_%H%M%S) || echo "No existing backend to backup"',
      'Backing up current backend'
    );
    
    // Create new backend directory
    await execCommand(
      'mkdir -p /var/www/clanplug/backend',
      'Creating backend directory'
    );
    
    // Upload the tarball
    await uploadFile('backend.tar.gz', '/var/www/clanplug/backend/backend.tar.gz');
    
    // Extract files
    await execCommand(
      'cd /var/www/clanplug/backend && tar -xzf backend.tar.gz && rm backend.tar.gz',
      'Extracting files'
    );
    
    // Copy production .env (check multiple locations)
    await execCommand(
      'if [ -f /var/www/clanplug/.env.production ]; then cp /var/www/clanplug/.env.production /var/www/clanplug/backend/.env; elif [ -f /var/www/clanplug/backend_backup*/env ]; then cp /var/www/clanplug/backend_backup*/.env /var/www/clanplug/backend/.env 2>/dev/null || echo "Using packaged .env"; else echo "No .env found, using packaged one"; fi',
      'Copying .env file'
    );
    
    // Install production dependencies (socket.io must be installed)
    await execCommand(
      'cd /var/www/clanplug/backend && npm install --production',
      'Installing dependencies'
    );
    
    // Restart PM2
    await execCommand(
      'cd /var/www/clanplug/backend && pm2 restart clanplug-api || pm2 start dist/server.js --name clanplug-api',
      'Restarting backend service'
    );
    
    // Wait a bit for server to start
    console.log('\n⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check logs
    await execCommand(
      'pm2 logs clanplug-api --lines 30 --nostream',
      'Checking server logs'
    );
    
    // Test Socket.IO endpoint
    await execCommand(
      'curl -s http://localhost:4000/socket.io/ | head -n 5',
      'Testing Socket.IO endpoint'
    );
    
    // Test groups API
    await execCommand(
      'curl -s http://localhost:4000/api/groups || echo "Groups API needs authentication"',
      'Testing groups API'
    );
    
    console.log('\n✅ DEPLOYMENT COMPLETE!');
    console.log('\n📋 Next steps:');
    console.log('1. Check frontend logs: pm2 logs clanplug-api');
    console.log('2. Test Socket.IO: curl https://api.clanplug.site/socket.io/');
    console.log('3. Test groups API with authenticated user');
    console.log('4. Check browser console for Socket.IO connection');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    conn.end();
    process.exit(1);
  }
}

deploy();
