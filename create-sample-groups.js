const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleGroups() {
  try {
    console.log('🚀 Creating sample groups...');

    // Sample group 1: Gaming Community
    const group1 = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: '🎮 Gaming Community',
        description: 'Discuss games, share tips, find teammates!',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created: Gaming Community');

    // Sample group 2: Marketplace Chat
    const group2 = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: '🛒 Marketplace Chat',
        description: 'Buy, sell, and trade items with the community',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created: Marketplace Chat');

    // Sample group 3: Tech Talk
    const group3 = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: '💻 Tech Talk',
        description: 'Discuss technology, coding, and gadgets',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created: Tech Talk');

    // Sample group 4: General Chat
    const group4 = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: '💬 General Chat',
        description: 'Casual conversations about anything and everything',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created: General Chat');

    // Sample group 5: Crypto & Trading
    const group5 = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name: '📈 Crypto & Trading',
        description: 'Discuss cryptocurrency, trading strategies, and market trends',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created: Crypto & Trading');

    console.log('\n✅ Sample groups created successfully!');
    console.log('\nGroup IDs:');
    console.log('Gaming Community:', group1.id);
    console.log('Marketplace Chat:', group2.id);
    console.log('Tech Talk:', group3.id);
    console.log('General Chat:', group4.id);
    console.log('Crypto & Trading:', group5.id);
    
    console.log('\n📝 Users can now join these groups via the app!');
  } catch (error) {
    console.error('❌ Error creating sample groups:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleGroups();
