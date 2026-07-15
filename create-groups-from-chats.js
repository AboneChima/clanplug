require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGroups() {
  try {
    console.log('🔍 Checking existing chats...\n');
    
    // Get all chats
    const allChats = await prisma.chat.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });
    
    console.log(`📊 Total chats: ${allChats.length}\n`);
    
    // Show chats with 3+ participants (potential groups)
    const multiUserChats = allChats.filter(chat => chat.participants.length >= 3);
    console.log(`👥 Chats with 3+ participants: ${multiUserChats.length}\n`);
    
    if (multiUserChats.length > 0) {
      console.log('These chats can be converted to groups:\n');
      multiUserChats.forEach((chat, index) => {
        console.log(`${index + 1}. Chat ID: ${chat.id}`);
        console.log(`   Name: ${chat.name || 'Unnamed'}`);
        console.log(`   Participants: ${chat.participants.length}`);
        console.log(`   Type: ${chat.type || 'ONE_TO_ONE'}`);
        console.log(`   Users: ${chat.participants.map(p => p.user.username || p.user.firstName).join(', ')}`);
        console.log('');
      });
      
      console.log('To convert these to groups, run:');
      console.log('UPDATE "Chat" SET type = \'GROUP\' WHERE id IN (');
      multiUserChats.forEach((chat, index) => {
        console.log(`  '${chat.id}'${index < multiUserChats.length - 1 ? ',' : ''}`);
      });
      console.log(');\n');
    }
    
    // Check existing GROUP type chats
    const existingGroups = allChats.filter(chat => chat.type === 'GROUP');
    console.log(`✅ Existing GROUP chats: ${existingGroups.length}\n`);
    
    if (existingGroups.length > 0) {
      console.log('Current groups:');
      existingGroups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name || 'Unnamed Group'} (${group.participants.length} members)`);
      });
    }
    
    // If user wants, we can auto-convert
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    if (multiUserChats.length > 0 && existingGroups.length === 0) {
      readline.question('\nConvert all multi-user chats to GROUPs? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\n🔄 Converting to groups...');
          const chatIds = multiUserChats.map(c => c.id);
          
          const result = await prisma.chat.updateMany({
            where: {
              id: { in: chatIds }
            },
            data: {
              type: 'GROUP'
            }
          });
          
          console.log(`✅ Converted ${result.count} chats to GROUP type`);
        }
        
        readline.close();
        await prisma.$disconnect();
      });
    } else {
      readline.close();
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createGroups();
