require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Finding duplicate chats...\n');

    // Get all chats with their participants
    const allChats = await prisma.chat.findMany({
      where: {
        type: 'DIRECT', // Only check direct chats (1-on-1)
        isActive: true
      },
      include: {
        participants: {
          where: { isActive: true },
          select: { userId: true }
        },
        messages: {
          select: { id: true },
          take: 1
        }
      }
    });

    console.log(`📊 Total DIRECT chats: ${allChats.length}\n`);

    // Group chats by participant pair (sorted to ensure consistency)
    const chatGroups = new Map();
    
    for (const chat of allChats) {
      if (chat.participants.length !== 2) continue; // Skip if not exactly 2 participants
      
      const userIds = chat.participants.map(p => p.userId).sort();
      const key = userIds.join('|');
      
      if (!chatGroups.has(key)) {
        chatGroups.set(key, []);
      }
      chatGroups.get(key).push(chat);
    }

    // Find duplicates
    let duplicateCount = 0;
    let deletedCount = 0;

    for (const [key, chats] of chatGroups) {
      if (chats.length > 1) {
        duplicateCount++;
        console.log(`\n🔴 Found ${chats.length} duplicate chats for users: ${key}`);
        
        // Sort by: 1) has messages, 2) most recent
        chats.sort((a, b) => {
          const aHasMessages = a.messages.length > 0 ? 1 : 0;
          const bHasMessages = b.messages.length > 0 ? 1 : 0;
          
          if (aHasMessages !== bHasMessages) {
            return bHasMessages - aHasMessages; // Prefer chat with messages
          }
          
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        // Keep the first one (has messages or most recent), delete the rest
        const keepChat = chats[0];
        const deleteChats = chats.slice(1);

        console.log(`  ✅ Keeping chat: ${keepChat.id} (${keepChat.messages.length} messages, updated: ${keepChat.updatedAt.toISOString()})`);
        
        for (const chat of deleteChats) {
          console.log(`  ❌ Deleting chat: ${chat.id} (${chat.messages.length} messages, updated: ${chat.updatedAt.toISOString()})`);
          
          // Delete messages first
          await prisma.chatMessage.deleteMany({
            where: { chatId: chat.id }
          });
          
          // Delete participants
          await prisma.chatParticipant.deleteMany({
            where: { chatId: chat.id }
          });
          
          // Delete chat
          await prisma.chat.delete({
            where: { id: chat.id }
          });
          
          deletedCount++;
        }
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Total duplicate groups found: ${duplicateCount}`);
    console.log(`   Duplicate chats deleted: ${deletedCount}`);
    console.log(`\n✅ Done!`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
