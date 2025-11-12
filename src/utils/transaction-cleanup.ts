import { PrismaClient, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cleanup expired pending transactions
 * This function should be called periodically to clean up old pending transactions
 */
export async function cleanupExpiredTransactions() {
  try {
    console.log('🧹 Starting transaction cleanup...');
    
    // Mark transactions as expired if they're older than 30 minutes and still pending
    const expiredTransactions = await prisma.transaction.updateMany({
      where: {
        status: TransactionStatus.PENDING,
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      },
      data: {
        status: TransactionStatus.FAILED,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Marked ${expiredTransactions.count} expired transactions as failed`);
    
    return {
      success: true,
      expiredCount: expiredTransactions.count
    };
  } catch (error) {
    console.error('❌ Transaction cleanup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove duplicate transactions based on reference
 * This is a one-time cleanup function
 */
export async function removeDuplicateTransactions() {
  try {
    console.log('🔍 Finding duplicate transactions...');
    
    // Find transactions with duplicate references
    const duplicates = await prisma.transaction.groupBy({
      by: ['reference'],
      having: {
        reference: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        reference: true
      }
    });

    let deletedCount = 0;

    for (const duplicate of duplicates) {
      // Get all transactions with this reference
      const transactions = await prisma.transaction.findMany({
        where: {
          reference: duplicate.reference
        },
        orderBy: {
          createdAt: 'desc' // Keep the most recent one
        }
      });

      // Delete all but the first (most recent) transaction
      if (transactions.length > 1) {
        const toDelete = transactions.slice(1);
        
        for (const transaction of toDelete) {
          await prisma.transaction.delete({
            where: {
              id: transaction.id
            }
          });
          deletedCount++;
        }
      }
    }

    console.log(`✅ Removed ${deletedCount} duplicate transactions`);
    
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error('❌ Duplicate removal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}