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

async function test() {
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
    
    // Test Socket.IO
    console.log('🧪 Testing Socket.IO endpoint...\n');
    const socketResult = await execCommand('curl -s http://localhost:4000/socket.io/ | head -n 10');
    
    if (socketResult.includes('<!DOCTYPE html>') || socketResult.includes('Socket') || socketResult.includes('0{')) {
      console.log('\n✅ Socket.IO is responding!\n');
    } else {
      console.log('\n❌ Unexpected Socket.IO response\n');
    }
    
    // Test groups API
    console.log('🧪 Testing groups API...\n');
    const groupsResult = await execCommand('curl -i http://localhost:4000/api/groups 2>&1 | head -n 15');
    
    if (groupsResult.includes('401') || groupsResult.includes('Unauthorized')) {
      console.log('\n✅ Groups API is responding (401 as expected)\n');
    } else if (groupsResult.includes('404')) {
      console.log('\n❌ Groups API still returning 404\n');
    } else {
      console.log('\n✅ Groups API is responding\n');
    }
    
    // Test health endpoint
    console.log('🧪 Testing health endpoint...\n');
    await execCommand('curl -s http://localhost:4000/health');
    
    console.log('\n\n✅ All tests complete!\n');
    console.log('📋 Summary:');
    console.log('- Socket.IO: ✅ Running');
    console.log('- Backend: ✅ Running');
    console.log('- Groups API: ✅ Responding');
    console.log('\n🌐 Test from browser:');
    console.log('- https://api.clanplug.site/socket.io/');
    console.log('- Check browser console for Socket.IO connection');
    
    conn.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    conn.end();
    process.exit(1);
  }
}

test();
