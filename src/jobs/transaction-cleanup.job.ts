import cron from 'node-cron';
import { cleanupExpiredTransactions } from '../utils/transaction-cleanup';

/**
 * Schedule transaction cleanup job
 * Runs every 15 minutes to clean up expired pending transactions
 */
export function startTransactionCleanupJob() {
  console.log('🕐 Starting transaction cleanup job scheduler...');
  console.log('⚠️ Transaction cleanup temporarily disabled due to database schema migration');
  console.log('✅ Transaction cleanup job scheduler initialized (cleanup disabled)');
  
  // TEMPORARILY DISABLED - Will re-enable after database schema is fixed
  // The cleanup job has been disabled to prevent errors during database migration
  // Re-enable by uncommenting the code below after running database sync
}

/**
 * Stop the cleanup job (for graceful shutdown)
 */
export function stopTransactionCleanupJob() {
  cron.getTasks().forEach(task => task.stop());
  console.log('🛑 Transaction cleanup job stopped');
}