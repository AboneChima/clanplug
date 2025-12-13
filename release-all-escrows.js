// Script to release all active escrows and refund money
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function releaseAllEscrows() {
  try {
    console.log('🔍 Finding all active escrows...');
    
    // Find all FUNDED or PENDING escrows
    const activeEscrows = await prisma.escrow.findMany({
      where: {
        status: {
          in: ['FUNDED', 'PENDING']
        }
      },
      include: {
        buyer: true,
        seller: true
      }
    });

    console.log(`📦 Found ${activeEscrows.length} active escrows`);

    for (const escrow of activeEscrows) {
      console.log(`\n💰 Processing escrow ${escrow.id}:`);
      console.log(`   Buyer: ${escrow.buyer.username}`);
      console.log(`   Amount: ${escrow.amount} ${escrow.currency}`);
      console.log(`   Status: ${escrow.status}`);

      // Refund money to buyer
      await prisma.$transaction(async (tx) => {
        // Get buyer's wallet
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_currency: {
              userId: escrow.buyerId,
              currency: escrow.currency
            }
          }
        });

        if (!wallet) {
          console.log(`   ❌ Wallet not found for buyer`);
          return;
        }

        // Calculate total amount (amount + fee)
        const totalAmount = parseFloat(escrow.amount.toString()) + parseFloat(escrow.fee.toString());

        // Refund to buyer's wallet
        await tx.wallet.update({
          where: {
            userId_currency: {
              userId: escrow.buyerId,
              currency: escrow.currency
            }
          },
          data: {
            balance: {
              increment: totalAmount
            }
          }
        });

        // Create refund transaction
        await tx.transaction.create({
          data: {
            userId: escrow.buyerId,
            walletId: wallet.id,
            type: 'ESCROW_REFUND',
            status: 'COMPLETED',
            amount: totalAmount,
            fee: 0,
            netAmount: totalAmount,
            currency: escrow.currency,
            reference: `REFUND-${escrow.id}`,
            description: `Escrow refund: ${escrow.title}`
          }
        });

        // Update escrow status
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: 'Admin refund - System fix'
          }
        });

        // Notify buyer
        await tx.notification.create({
          data: {
            userId: escrow.buyerId,
            type: 'ESCROW',
            title: '✅ Escrow Refunded',
            message: `Your escrow payment of ${totalAmount} ${escrow.currency} has been refunded to your wallet.`,
            data: {
              escrowId: escrow.id,
              amount: totalAmount,
              currency: escrow.currency
            }
          }
        });

        console.log(`   ✅ Refunded ${totalAmount} ${escrow.currency} to ${escrow.buyer.username}`);
      });
    }

    console.log(`\n✅ All escrows processed successfully!`);
    console.log(`📊 Total refunded: ${activeEscrows.length} escrows`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
releaseAllEscrows();
