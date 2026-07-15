const { Client } = require('ssh2');
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
    
    // Upload compiled files
    console.log('Uploading community service...\n');
    const servicePath = path.join(__dirname, 'dist', 'services', 'community.service.js');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/services/community.service.js << 'EOFSERVICE'
${serviceContent}
EOFSERVICE`);
    
    console.log('Uploading community controller...\n');
    const controllerPath = path.join(__dirname, 'dist', 'controllers', 'community.controller.js');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/controllers/community.controller.js << 'EOFCONTROLLER'
${controllerContent}
EOFCONTROLLER`);
    
    console.log('Uploading community routes...\n');
    const routesPath = path.join(__dirname, 'dist', 'routes', 'community.routes.js');
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/routes/community.routes.js << 'EOFROUTES'
${routesContent}
EOFROUTES`);
    
    console.log('Uploading updated socket.js...\n');
    const socketPath = path.join(__dirname, 'dist', 'socket', 'socket.js');
    const socketContent = fs.readFileSync(socketPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/socket/socket.js << 'EOFSOCKET'
${socketContent}
EOFSOCKET`);
    
    console.log('Uploading updated server.js...\n');
    const serverPath = path.join(__dirname, 'dist', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/server.js << 'EOFSERVER'
${serverContent}
EOFSERVER`);
    
    console.log('Uploading updated follow service...\n');
    const followPath = path.join(__dirname, 'dist', 'services', 'follow.service.js');
    const followContent = fs.readFileSync(followPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/services/follow.service.js << 'EOFFOLLOW'
${followContent}
EOFFOLLOW`);
    
    console.log('Uploading updated chat service...\n');
    const chatPath = path.join(__dirname, 'dist', 'services', 'chat.service.js');
    const chatContent = fs.readFileSync(chatPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/services/chat.service.js << 'EOFCHAT'
${chatContent}
EOFCHAT`);
    
    console.log('Uploading updated chat routes...\n');
    const chatRoutesPath = path.join(__dirname, 'dist', 'routes', 'chat.routes.js');
    const chatRoutesContent = fs.readFileSync(chatRoutesPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/routes/chat.routes.js << 'EOFCHATROUTES'
${chatRoutesContent}
EOFCHATROUTES`);
    
    console.log('Uploading updated chat controller...\n');
    const chatControllerPath = path.join(__dirname, 'dist', 'controllers', 'chat.controller.js');
    const chatControllerContent = fs.readFileSync(chatControllerPath, 'utf8');
    await execCommand(`cat > /var/www/clanplug/backend/dist/controllers/chat.controller.js << 'EOFCHATCONTROLLER'
${chatControllerContent}
EOFCHATCONTROLLER`);
    
    console.log('\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\nDeployment complete!');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
