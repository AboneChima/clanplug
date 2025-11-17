import cron from 'node-cron';
import { cleanupExpiredTransactions } from '../utils/transaction-cleanup';

/**
 * Schedule transaction cleanup job
 * Runs every 15 minutes to clean up expired pending transactions
 */
export function startTransactionCleanupJob() {
  console.log('🕐 Starting transaction cleanup job scheduler...');
  console.log('⚠️ Transaction cleanup temporarily disabled due to database schema migration');
  
  // TEMPORARILY DISABLED - Will re-enable after database schema is fixed
  // TODO: Re-enable after running database sync
  
  /*
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('🧹 Running scheduled transaction cleanup...');
    
    try {
      const result = await cleanupExpiredTransactions();
      
      if (result.success) {
        console.log(`✅ Cleanup completed: ${result.expiredCount} transactions processed`);
      } else {
        console.error('❌ Cleanup failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Cleanup job error:', error);
    }
  });

  // Run cleanup immediately on startup
  setTimeout(async () => {
    console.log('🧹 Running initial transaction cleanup...');
    const result = await cleanupExpiredTransactions();
    
    if (result.success) {
      console.log(`✅ Initial cleanup completed: ${result.expiredCount} transactions processed`);
    } else {
      console.error('❌ Initial cleanup failed:', result.error);
    }
  }, 5000); // Wait 5 seconds after startup
  */

  console.log('✅ Transaction cleanup job scheduler initialized (cleanup disabled)');
}

/**
 * Stop the cleanup job (for graceful shutdown)
 */
export function stopTransactionCleanupJob() {
  cron.getTasks().forEach(task => task.stop());
  console.log('🛑 Transaction cleanup job stopped');
}