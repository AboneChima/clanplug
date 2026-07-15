#!/bin/bash
cd /var/www/clanplug/backend

echo "Checking for groups in database..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const chats = await prisma.chat.findMany({
      where: { type: 'GROUP' },
      include: { participants: true }
    });
    console.log('GROUP chats found:', chats.length);
    
    const allChats = await prisma.chat.findMany({
      include: { participants: true }
    });
    console.log('Total chats:', allChats.length);
    
    const multiUser = allChats.filter(c => c.participants.length >= 3);
    console.log('Multi-user chats (3+ members):', multiUser.length);
    
    if (multiUser.length > 0) {
      console.log('\nChats to convert:');
      multiUser.forEach(c => {
        console.log('ID:', c.id, '| Name:', c.name || 'Unnamed', '| Members:', c.participants.length, '| Type:', c.type || 'ONE_TO_ONE');
      });
      
      console.log('\n\nSQL to convert:');
      const ids = multiUser.map(c => \"'\" + c.id + \"'\").join(', ');
      console.log('UPDATE \"Chat\" SET type = \\'GROUP\\' WHERE id IN (' + ids + ');');
    }
    
    await prisma.\$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
"
