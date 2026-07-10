const { Client } = require('ssh2');

const conn = new Client();

console.log('🔧 Connecting to VPS to setup push notifications...\n');

conn.on('ready', () => {
  console.log('✅ Connected to VPS\n');
  
  const commands = [
    'cd /root/clanplug',
    'echo "📦 Installing web-push..."',
    'npm install web-push',
    'echo "🔑 Checking VAPID keys in .env..."',
    'grep -q "VAPID_PUBLIC_KEY" .env && echo "Keys already exist" || echo "\n# Push Notifications - VAPID Keys\nVAPID_PUBLIC_KEY=BHpd9-yFkjQy2i-uxeFvATb2dmf_ZOJp0FrrgeVGHPbPx528FprwkqtC6dXLfHKREdGS2Ad9uj5U28rNDoLfmJo\nVAPID_PRIVATE_KEY=Gg9tmkOv9NpXFQMI6Q7sKc9GmtRBWyzuVvPVZ8PHCKE\nVAPID_SUBJECT=mailto:support@clanplug.site" >> .env',
    'echo "🔄 Rebuilding backend..."',
    'npm run build',
    'echo "♻️ Restarting backend with PM2..."',
    'pm2 restart clanplug-backend',
    'echo "📊 Checking backend status..."',
    'pm2 status'
  ];

  const fullCommand = commands.join(' && ');

  conn.exec(fullCommand, (err, stream) => {
    if (err) {
      console.error('❌ Error:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      console.log('\n✅ Push notifications setup complete!');
      console.log('🧪 Now test at: https://www.clanplug.site/settings');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '176.57.189.248',
  port: 22,
  username: 'root',
  password: 'ClanPlugDB2024'
});

conn.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
});
