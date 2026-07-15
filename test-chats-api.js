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
    
    console.log('Testing /api/chats endpoint for hackerfx user...\n');
    await execCommand(`cat > /var/www/clanplug/backend/test-api.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find hackerfx user
    const user = await prisma.user.findFirst({
      where: { email: 'hackerfx@gmail.com' }
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('User ID:', user.id);
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET
    );
    
    console.log('\\nTesting API call...\\n');
    
    // Call the chats API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:4000/api/chats', {
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('\\nResponse:', JSON.stringify(data, null, 2));
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
EOF`);
    
    await execCommand('cd /var/www/clanplug/backend && node test-api.js');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
