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
    
    const sql = `
UPDATE "Chat"
SET type = 'GROUP'
WHERE id IN (
  SELECT c.id
  FROM "Chat" c
  JOIN "ChatParticipant" cp ON c.id = cp."chatId"
  WHERE cp."isActive" = true
  GROUP BY c.id
  HAVING COUNT(cp.id) >= 3
);

SELECT 
  c.id,
  c.name,
  c.type,
  COUNT(cp.id) as member_count
FROM "Chat" c
LEFT JOIN "ChatParticipant" cp ON c.id = cp."chatId"
WHERE cp."isActive" = true
GROUP BY c.id, c.name, c.type
HAVING COUNT(cp.id) >= 3
ORDER BY member_count DESC;
`;
    
    console.log('Running SQL...\n');
    await execCommand(`cd /var/www/clanplug/backend && echo '${sql.replace(/'/g, "'\\''")}' | npx prisma db execute --stdin --schema=./prisma/schema.prisma`);
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
