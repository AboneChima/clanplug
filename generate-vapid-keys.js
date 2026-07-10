// Generate VAPID keys for web push notifications
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=================================');
console.log('VAPID Keys Generated Successfully');
console.log('=================================\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@clanplug.site`);
console.log('\nAdd this to web/.env.local:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('\n=================================\n');
