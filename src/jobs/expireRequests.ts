import cron from 'node-cron';
import { purchaseRequestService } from '../services/purchaseRequest.service';

// Run every minute to check for expired requests
export const startExpirationJob = () => {
  console.log('🕐 Starting purchase request expiration job...');
  
  cron.schedule('* * * * *', async () => {
    try {
      const expired = await purchaseRequestService.expireOldRequests();
      if (expired > 0) {
        console.log(`⏰ Expired ${expired} purchase requests`);
      }
    } catch (error) {
      console.error('❌ Error expiring purchase requests:', error);
    }
  });

  console.log('✅ Expiration job started (runs every minute)');
};
