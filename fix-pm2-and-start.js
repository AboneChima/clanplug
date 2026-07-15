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
        resolve({ output, errorOutput, code });
      });
    });
  });
}

async function fixAndStart() {
  try {
    const password = await askPassword();
    rl.close();
    
    console.log('\nConnecting to VPS...\n');
    
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve)
        .on('error', reject)
        .connect({
          host: '176.57.189.248',
          port: 22,
          username: 'root',
          password: password
        });
    });
    
    console.log('✅ Connected!\n');
    
    // Check PM2 list
    console.log('📋 Checking PM2 processes...\n');
    const listResult = await execCommand('pm2 list');
    
    // Check if backend is already running
    console.log('\n🔍 Looking for existing backend process...\n');
    const jlistResult = await execCommand('pm2 jlist');
    
    let processName = null;
    try {
      const processes = JSON.parse(jlistResult.output);
      if (processes.length > 0) {
        processName = processes[0].name;
        console.log(`\n✅ Found process: ${processName}\n`);
      }
    } catch (e) {
      console.log('\n⚠️  No existing PM2 processes found\n');
    }
    
    // Start or restart
    if (processName) {
      console.log(`🔄 Restarting ${processName}...\n`);
      await execCommand(`pm2 restart ${processName}`);
    } else {
      console.log('🚀 Starting new backend process...\n');
      await execCommand('cd /var/www/clanplug/backend && pm2 start dist/server.js --name clanplug-backend');
    }
    
    console.log('\n⏳ Waiting 5 seconds for startup...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Show logs
    console.log('📋 Recent logs:\n');
    await execCommand('pm2 logs --lines 30 --nostream');
    
    // Test Socket.IO
    console.log('\n🧪 Testing Socket.IO endpoint...\n');
    const socketTest = await execCommand('curl -s http://localhost:4000/socket.io/ | head -n 10');
    
    if (socketTest.output.includes('<!DOCTYPE html>') || socketTest.output.includes('Socket')) {
      console.log('\n✅ Socket.IO is responding!\n');
    } else {
      console.log('\n❌ Socket.IO returned unexpected response\n');
    }
    
    // Test groups API
    console.log('🧪 Testing groups API...\n');
    await execCommand('curl -i http://localhost:4000/api/groups 2>&1 | head -n 5');
    
    console.log('\n✅ Deployment complete!\n');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

fixAndStart();
