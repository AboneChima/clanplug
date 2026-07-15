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
    
    console.log('Creating test script...\n');
    await execCommand(`cat > /var/www/clanplug/backend/get-user.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find any active user
    const user = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
    
    if (!user) {
      console.error('No active user found');
      return;
    }
    
    console.log('\\nFound user:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    
    // Generate a token with issuer and audience
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'lordmoon_super_secret_jwt_key_development_only',
      { 
        expiresIn: '7d',
        issuer: process.env.APP_NAME || 'Lordmoon',
        audience: process.env.APP_URL || 'http://localhost:4000'
      }
    );
    
    console.log('\\nToken for testing:', token);
    
    // Test the groups API
    console.log('\\n\\nTesting groups API...');
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:4000/api/groups', {
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
EOF`);
    
    console.log('\nRunning test...\n');
    await execCommand('cd /var/www/clanplug/backend && node get-user.js');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
