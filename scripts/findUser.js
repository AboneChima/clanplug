const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const email = process.argv[2] || 'abonejoseph@gmail.com';

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('USER:', user);

    if (user) {
      const wallets = await prisma.wallet.findMany({
        where: { userId: user.id },
        select: { currency: true, balance: true },
      });
      console.log('WALLETS:', wallets);
    }
  } catch (e) {
    console.error('ERROR:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();