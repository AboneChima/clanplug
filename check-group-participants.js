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
    
    console.log('Creating check script...\n');
    await execCommand(`cat > /var/www/clanplug/backend/check-groups.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking groups...\\n');
    
    const groups = await prisma.chat.findMany({
      where: { type: 'GROUP' },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log(\`Found \${groups.length} groups:\\n\`);
    
    groups.forEach(group => {
      console.log(\`Group: \${group.name} (ID: \${group.id})\`);
      console.log(\`  Members: \${group.participants.length}\`);
      group.participants.forEach(p => {
        console.log(\`    - \${p.user.username} (\${p.user.email})\`);
      });
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
EOF`);
    
    console.log('\nRunning check...\n');
    await execCommand('cd /var/www/clanplug/backend && node check-groups.js');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
