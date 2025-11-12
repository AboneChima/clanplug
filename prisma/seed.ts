import { PrismaClient, Currency, UserStatus, TransactionType, TransactionStatus, PostType, PostStatus, UserRole, GameCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random referral codes
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to generate random transaction references
function generateTransactionRef(): string {
  return 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const users = [
    {
      email: 'admin@lordmoon.local',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin123!',
      status: 'ACTIVE' as UserStatus,
      role: 'ADMIN' as UserRole
    },
    {
      email: 'john@lordmoon.local',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Password123!',
      status: 'ACTIVE' as UserStatus,
      role: 'USER' as UserRole
    },
    {
      email: 'jane@lordmoon.local',
      username: 'janesmith',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'Password123!',
      status: 'ACTIVE' as UserStatus,
      role: 'USER' as UserRole
    },
    {
      email: 'mike@lordmoon.local',
      username: 'mikejohnson',
      firstName: 'Mike',
      lastName: 'Johnson',
      password: 'Password123!',
      status: 'PENDING_VERIFICATION' as UserStatus,
      role: 'USER' as UserRole
    },
    {
      email: 'sarah@lordmoon.local',
      username: 'sarahwilson',
      firstName: 'Sarah',
      lastName: 'Wilson',
      password: 'Password123!',
      status: 'ACTIVE' as UserStatus,
      role: 'USER' as UserRole
    }
  ];

  const createdUsers = [];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const referralCode = generateReferralCode();

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        referralCode,
        passwordHash,
        status: userData.status,
        role: userData.role,
        isKYCVerified: true,
        isEmailVerified: true
      }
    });

    createdUsers.push(user);
    console.log(`✅ Created user: ${userData.username} (${userData.email})`);
  }

  // Create wallets for users with initial balances
  const walletData = [
    { userId: createdUsers[0].id, currency: Currency.NGN, balance: 50000.00 }, // Admin
    { userId: createdUsers[0].id, currency: Currency.USD, balance: 100.00 },
    { userId: createdUsers[1].id, currency: Currency.NGN, balance: 25000.00 }, // John
    { userId: createdUsers[1].id, currency: Currency.USD, balance: 50.00 },
    { userId: createdUsers[2].id, currency: Currency.NGN, balance: 75000.00 }, // Jane
    { userId: createdUsers[2].id, currency: Currency.USD, balance: 150.00 },
    { userId: createdUsers[3].id, currency: Currency.NGN, balance: 10000.00 }, // Mike
    { userId: createdUsers[4].id, currency: Currency.NGN, balance: 30000.00 }, // Sarah
    { userId: createdUsers[4].id, currency: Currency.USD, balance: 75.00 }
  ];

  for (const wallet of walletData) {
    await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: wallet.userId,
          currency: wallet.currency
        }
      },
      update: {
        balance: wallet.balance,
        totalDeposits: wallet.balance
      },
      create: {
        userId: wallet.userId,
        currency: wallet.currency,
        balance: wallet.balance,
        totalDeposits: wallet.balance,
        totalWithdrawals: 0
      }
    });
  }

  console.log('✅ Created wallets with initial balances');

  // Create sample posts
  const posts = [
    {
      userId: createdUsers[1].id, // John
      type: PostType.SOCIAL_POST,
      title: 'Welcome to LordMoon!',
      description: 'Excited to be part of this amazing community. Looking forward to connecting with everyone here! 🚀',
      images: []
    },
    {
      userId: createdUsers[2].id, // Jane
      type: PostType.SERVICE_OFFER,
      title: 'Professional Web Development Services',
      description: 'Just finished an amazing project! Here are some highlights from my recent work. #productivity #success',
      price: 50000.00,
      currency: Currency.NGN,
      images: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800']
    },
    {
      userId: createdUsers[1].id, // John
      type: PostType.SOCIAL_POST,
      title: 'New Wallet Features',
      description: 'Has anyone tried the new wallet features? The multi-currency support is fantastic! Great work by the team.',
      images: []
    },
    {
      userId: createdUsers[4].id, // Sarah
      type: PostType.SOCIAL_POST,
      title: 'Beautiful Sunset',
      description: 'Beautiful sunset from my office window today. Sometimes you need to pause and appreciate the little things in life. 🌅',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800']
    },
    {
      userId: createdUsers[2].id, // Jane
      type: PostType.SOCIAL_POST,
      title: 'Security Tip',
      description: 'Quick tip: Always enable two-factor authentication on your accounts for better security. Stay safe out there! 🔐',
      images: []
    },
    {
      userId: createdUsers[1].id, // John
      type: PostType.SOCIAL_POST,
      title: 'Team Building',
      description: 'Team lunch today! Great to connect with colleagues outside of work. Building relationships is so important. 👥',
      images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800']
    }
  ];

  const createdPosts = [];

  for (const postData of posts) {
    const post = await prisma.post.create({
      data: {
        userId: postData.userId,
        type: postData.type,
        title: postData.title,
        description: postData.description,
        price: postData.price,
        currency: postData.currency,
        images: postData.images,
        videos: [],
        tags: [],
        likeCount: Math.floor(Math.random() * 20), // Random likes between 0-19
        commentCount: Math.floor(Math.random() * 10) // Random comments between 0-9
      }
    });

    createdPosts.push(post);
  }

  console.log(`✅ Created ${createdPosts.length} sample posts`);

  // Create some post likes
  const likes = [
    { postId: createdPosts[0].id, userId: createdUsers[2].id }, // Jane likes John's welcome post
    { postId: createdPosts[0].id, userId: createdUsers[4].id }, // Sarah likes John's welcome post
    { postId: createdPosts[1].id, userId: createdUsers[1].id }, // John likes Jane's project post
    { postId: createdPosts[1].id, userId: createdUsers[4].id }, // Sarah likes Jane's project post
    { postId: createdPosts[3].id, userId: createdUsers[1].id }, // John likes Sarah's sunset post
    { postId: createdPosts[3].id, userId: createdUsers[2].id }, // Jane likes Sarah's sunset post
    { postId: createdPosts[4].id, userId: createdUsers[1].id }, // John likes Jane's security tip
  ];

  for (const like of likes) {
    await prisma.like.upsert({
      where: {
        userId_postId: {
          postId: like.postId,
          userId: like.userId
        }
      },
      update: {},
      create: {
        postId: like.postId,
        userId: like.userId
      }
    });
  }

  console.log(`✅ Created ${likes.length} post likes`);

  // Create sample transactions
  const transactions = [
    {
      userId: createdUsers[1].id, // John
      walletId: '', // Will be set after wallet lookup
      type: TransactionType.DEPOSIT,
      amount: 25000.00,
      currency: Currency.NGN,
      status: TransactionStatus.COMPLETED,
      description: 'Initial wallet funding'
    },
    {
      userId: createdUsers[1].id, // John
      walletId: '', // Will be set after wallet lookup
      type: TransactionType.DEPOSIT,
      amount: 50.00,
      currency: Currency.USD,
      status: TransactionStatus.COMPLETED,
      description: 'USD wallet funding'
    },
    {
      userId: createdUsers[2].id, // Jane
      walletId: '', // Will be set after wallet lookup
      type: TransactionType.DEPOSIT,
      amount: 75000.00,
      currency: Currency.NGN,
      status: TransactionStatus.COMPLETED,
      description: 'Initial wallet funding'
    },
    {
      userId: createdUsers[4].id, // Sarah
      walletId: '', // Will be set after wallet lookup
      type: TransactionType.DEPOSIT,
      amount: 30000.00,
      currency: Currency.NGN,
      status: TransactionStatus.COMPLETED,
      description: 'Initial wallet funding'
    },
    {
      userId: createdUsers[3].id, // Mike
      walletId: '', // Will be set after wallet lookup
      type: TransactionType.DEPOSIT,
      amount: 10000.00,
      currency: Currency.NGN,
      status: TransactionStatus.PENDING,
      description: 'Pending deposit verification'
    }
  ];

  for (const txnData of transactions) {
    // Find the wallet for this user and currency
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId: txnData.userId,
          currency: txnData.currency
        }
      }
    });

    if (wallet) {
      await prisma.transaction.create({
        data: {
          userId: txnData.userId,
          walletId: wallet.id,
          type: txnData.type,
          amount: txnData.amount,
          fee: 0,
          netAmount: txnData.amount,
          currency: txnData.currency,
          status: txnData.status,
          description: txnData.description,
          reference: generateTransactionRef()
        }
      });
    }
  }

  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Create popular games
  const gamesData = [
    {
      name: 'Call of Duty Mobile',
      slug: 'call-of-duty-mobile',
      description: 'Popular mobile battle royale and multiplayer shooter',
      category: 'BATTLE_ROYALE' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 150,
      features: ['Battle Royale', 'Multiplayer', 'Ranked Matches', 'Weapon Skins'],
      isPopular: true,
      sortOrder: 1
    },
    {
      name: 'Free Fire',
      slug: 'free-fire',
      description: 'Fast-paced battle royale game with unique characters',
      category: 'BATTLE_ROYALE' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 80,
      features: ['Battle Royale', 'Character Skills', 'Pet System', 'Diamonds'],
      isPopular: true,
      sortOrder: 2
    },
    {
      name: 'PUBG Mobile',
      slug: 'pubg-mobile',
      description: 'Original battle royale experience on mobile',
      category: 'BATTLE_ROYALE' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 100,
      features: ['Battle Royale', 'Team Deathmatch', 'Skins', 'UC Currency'],
      isPopular: true,
      sortOrder: 3
    },
    {
      name: 'FIFA Mobile',
      slug: 'fifa-mobile',
      description: 'Ultimate football experience on mobile',
      category: 'SPORTS' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 120,
      features: ['Ultimate Team', 'Career Mode', 'Player Cards', 'FIFA Points'],
      isPopular: true,
      sortOrder: 4
    },
    {
      name: 'Mobile Legends',
      slug: 'mobile-legends',
      description: '5v5 MOBA game with heroes and strategy',
      category: 'MOBA' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 30,
      features: ['5v5 Battles', 'Hero Collection', 'Ranked System', 'Diamonds'],
      isPopular: true,
      sortOrder: 5
    },
    {
      name: 'Clash of Clans',
      slug: 'clash-of-clans',
      description: 'Build your village and battle with clans',
      category: 'STRATEGY' as GameCategory,
      platforms: ['Android', 'iOS'],
      minLevel: 1,
      maxLevel: 15,
      features: ['Village Building', 'Clan Wars', 'Gems', 'Troops'],
      isPopular: true,
      sortOrder: 6
    },
    {
      name: 'Genshin Impact',
      slug: 'genshin-impact',
      description: 'Open-world action RPG with gacha system',
      category: 'RPG' as GameCategory,
      platforms: ['Android', 'iOS', 'PC', 'PlayStation'],
      minLevel: 1,
      maxLevel: 60,
      features: ['Open World', 'Gacha System', 'Primogems', 'Characters'],
      isPopular: true,
      sortOrder: 7
    },
    {
      name: 'Fortnite',
      slug: 'fortnite',
      description: 'Battle royale with building mechanics',
      category: 'BATTLE_ROYALE' as GameCategory,
      platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
      minLevel: 1,
      maxLevel: 200,
      features: ['Battle Royale', 'Creative Mode', 'V-Bucks', 'Skins'],
      isPopular: true,
      sortOrder: 8
    }
  ];

  const createdGames = [];
  for (const gameData of gamesData) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: gameData,
      create: gameData
    });
    createdGames.push(game);
  }

  console.log(`✅ Created ${createdGames.length} popular games`);

  // Create some user follows
  const follows = [
    { followerId: createdUsers[1].id, followingId: createdUsers[2].id }, // John follows Jane
    { followerId: createdUsers[2].id, followingId: createdUsers[1].id }, // Jane follows John
    { followerId: createdUsers[1].id, followingId: createdUsers[4].id }, // John follows Sarah
    { followerId: createdUsers[4].id, followingId: createdUsers[1].id }, // Sarah follows John
    { followerId: createdUsers[2].id, followingId: createdUsers[4].id }, // Jane follows Sarah
    { followerId: createdUsers[4].id, followingId: createdUsers[2].id }, // Sarah follows Jane
  ];

  for (const follow of follows) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: follow.followerId,
          followingId: follow.followingId
        }
      },
      update: {},
      create: {
        followerId: follow.followerId,
        followingId: follow.followingId
      }
    });
  }

  console.log(`✅ Created ${follows.length} user follows`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👥 Users: ${createdUsers.length}`);
  console.log(`   💰 Wallets: ${walletData.length}`);
  console.log(`   🎮 Games: ${createdGames.length}`);
  console.log(`   📝 Posts: ${createdPosts.length}`);
  console.log(`   ❤️  Likes: ${likes.length}`);
  console.log(`   💸 Transactions: ${transactions.length}`);
  console.log(`   👫 Follows: ${follows.length}`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: admin@lordmoon.local / Admin123!');
  console.log('   User 1: john@lordmoon.local / Password123!');
  console.log('   User 2: jane@lordmoon.local / Password123!');
  console.log('   User 3: mike@lordmoon.local / Password123!');
  console.log('   User 4: sarah@lordmoon.local / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });