require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  try {
    console.log('🔍 Checking for existing groups...\n');
    
    // Get all GROUP type chats
    const groups = await prisma.chat.findMany({
      where: {
        type: 'GROUP',
        isActive: true
      },
      include: {
        participants: {
          where: { isActive: true },
          select: { userId: true }
        }
      }
    });
    
    console.log(`📊 Found ${groups.length} groups in database:\n`);
    
    if (groups.length === 0) {
      console.log('❌ No groups found!');
      console.log('\n💡 To create sample groups, run: node create-sample-groups.js\n');
    } else {
      groups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name || 'Unnamed Group'}`);
        console.log(`   ID: ${group.id}`);
        console.log(`   Members: ${group.participants.length}`);
        console.log(`   Created: ${new Date(group.createdAt).toLocaleDateString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking groups:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();
