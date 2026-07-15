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
    
    console.log('Creating fix script on VPS...\n');
    await execCommand(`cat > /var/www/clanplug/backend/fix-groups.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
    
    const totalChats = await prisma.chat.count();
    console.log('Total chats:', totalChats);
    
    const groupChats = await prisma.chat.count({
      where: { type: 'GROUP' }
    });
    console.log('GROUP chats:', groupChats);
    
    // Find multi-user chats using Prisma methods instead of raw query
    const allChats = await prisma.chat.findMany({
      include: {
        participants: {
          where: { isActive: true }
        }
      }
    });
    
    const multiUserChats = allChats
      .filter(chat => chat.participants.length >= 3)
      .slice(0, 20)
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        member_count: chat.participants.length
      }));
    
    console.log('\\nMulti-user chats (3+ members):', multiUserChats.length);
    multiUserChats.forEach(chat => {
      console.log(\`  - \${chat.name || 'Unnamed'} (\${chat.member_count} members, type: \${chat.type || 'ONE_TO_ONE'})\`);
    });
    
    if (multiUserChats.length > 0) {
      console.log('\\nConverting to GROUPs...');
      const ids = multiUserChats.map(c => c.id);
      const updateResult = await prisma.chat.updateMany({
        where: { 
          id: { in: ids },
          type: { not: 'GROUP' }
        },
        data: { type: 'GROUP' }
      });
      console.log(\`Converted \${updateResult.count} chats to GROUP type\`);
    } else {
      console.log('\\nNo multi-user chats to convert.');
    }
    
    // Show final stats
    const finalGroupCount = await prisma.chat.count({
      where: { type: 'GROUP' }
    });
    console.log('\\nFinal GROUP chat count:', finalGroupCount);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
EOF`);
    
    console.log('\nRunning fix script...\n');
    await execCommand('cd /var/www/clanplug/backend && node fix-groups.js');
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\nDone! The backend has been restarted.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
