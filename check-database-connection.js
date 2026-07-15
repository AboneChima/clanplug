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
    
    console.log('Checking DATABASE_URL...\n');
    await execCommand('cd /var/www/clanplug/backend && grep DATABASE_URL .env | head -n 1');
    
    console.log('\n\nTesting database connection...\n');
    await execCommand(`cd /var/www/clanplug/backend && node -e "
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      (async () => {
        try {
          const result = await prisma.\\$queryRaw\\\`SELECT COUNT(*) as count FROM \\\"Chat\\\"\\\`;
          console.log('Total chats:', result[0].count);
          
          const groups = await prisma.\\$queryRaw\\\`SELECT COUNT(*) as count FROM \\\"Chat\\\" WHERE type = 'GROUP'\\\`;
          console.log('GROUP chats:', groups[0].count);
          
          const multiUser = await prisma.\\$queryRaw\\\`
            SELECT c.id, c.name, c.type, COUNT(cp.id) as member_count
            FROM \\\"Chat\\\" c
            JOIN \\\"ChatParticipant\\\" cp ON c.id = cp.\\\"chatId\\\"
            WHERE cp.\\\"isActive\\\" = true
            GROUP BY c.id
            HAVING COUNT(cp.id) >= 3
            LIMIT 10
          \\\`;
          
          console.log('\\nMulti-user chats (3+ members):', multiUser.length);
          multiUser.forEach(chat => {
            console.log(\\\`  - \\\${chat.name || 'Unnamed'} (\\\${chat.member_count} members, type: \\\${chat.type || 'ONE_TO_ONE'})\\\`);
          });
          
          if (multiUser.length > 0) {
            console.log('\\n\\nConverting to GROUPs...');
            const ids = multiUser.map(c => c.id);
            const updateResult = await prisma.chat.updateMany({
              where: { id: { in: ids } },
              data: { type: 'GROUP' }
            });
            console.log(\\\`Converted \\\${updateResult.count} chats to GROUP type\\\`);
          }
          
          await prisma.\\$disconnect();
        } catch (e) {
          console.error('Error:', e.message);
          process.exit(1);
        }
      })();
    "`);
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\nDone! Refresh browser.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
