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
    
    console.log('Checking chats...\n');
    const output = await execCommand(`
      cd /var/www/clanplug/backend && \
      node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        (async () => {
          const chats = await prisma.chat.findMany({ include: { participants: true } });
          const multiUser = chats.filter(c => c.participants.length >= 3);
          console.log('Multi-user chats:', multiUser.length);
          
          if (multiUser.length > 0) {
            const ids = multiUser.map(c => c.id);
            await prisma.chat.updateMany({ where: { id: { in: ids } }, data: { type: 'GROUP' } });
            console.log('Converted', multiUser.length, 'chats to GROUP type');
          }
          
          await prisma.\\\$disconnect();
        })();
      "
    `);
    
    console.log('\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\nDone! Refresh browser and check groups again.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
