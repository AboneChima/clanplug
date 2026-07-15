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
    
    console.log('Creating test groups script...\n');
    await execCommand(`cat > /var/www/clanplug/backend/create-groups.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const gameGroups = [
      {
        name: 'Free Fire Community',
        description: 'Join fellow Free Fire players! Share strategies, squad up, and dominate the battlefield together.',
        image: '/free fire.jpeg'
      },
      {
        name: 'Call of Duty Mobile',
        description: 'Connect with COD Mobile warriors. Team up for ranked matches and battle royale.',
        image: '/codm.jpeg'
      },
      {
        name: 'PUBG Mobile Squad',
        description: 'PUBG Mobile players unite! Find teammates, share tips, and get that chicken dinner.',
        image: '/pubg.jpeg'
      },
      {
        name: 'FIFA Mobile League',
        description: 'FIFA Mobile community for trading tips, team building, and friendly matches.',
        image: '/fifa.jpeg'
      },
      {
        name: 'eFootball Players',
        description: 'eFootball enthusiasts gather here. Discuss tactics, trade players, and challenge each other.',
        image: '/e football.jpeg'
      }
    ];
    
    console.log('Creating game community groups...\\n');
    
    for (const group of gameGroups) {
      const existing = await prisma.chat.findFirst({
        where: { name: group.name }
      });
      
      if (existing) {
        console.log(\`✅ Group "\${group.name}" already exists\`);
        // Update to GROUP type if not already
        if (existing.type !== 'GROUP') {
          await prisma.chat.update({
            where: { id: existing.id },
            data: { type: 'GROUP' }
          });
          console.log(\`  → Updated to GROUP type\`);
        }
        continue;
      }
      
      const chat = await prisma.chat.create({
        data: {
          name: group.name,
          description: group.description,
          type: 'GROUP',
          isActive: true
        }
      });
      
      console.log(\`✅ Created group: \${group.name} (ID: \${chat.id})\`);
    }
    
    // Count groups
    const groupCount = await prisma.chat.count({
      where: { type: 'GROUP' }
    });
    
    console.log(\`\\n\\nTotal groups: \${groupCount}\`);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
EOF`);
    
    console.log('\nRunning script...\n');
    await execCommand('cd /var/www/clanplug/backend && node create-groups.js');
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\nDone!');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
