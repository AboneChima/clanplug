import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import walletRoutes from './wallet.routes';
import postRoutes from './post.routes';
import gameRoutes from './game.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import vtuRoutes from './vtu.routes';
import escrowRoutes from './escrow.routes';
import notificationRoutes from './notification.routes';
import commentRoutes from './comment.routes';
import paymentRoutes from './payment.routes';
import cryptoRoutes from './crypto.routes';
import reportRoutes from './report.routes';
import userDashboardRoutes from './user-dashboard.routes';
import listingRoutes from './listing.routes';
import purchaseRoutes from './purchase.routes';
import webhookRoutes from './webhook.routes';
import withdrawalRoutes from './withdrawal.routes';
import testRoutes from './test.routes';
import storyRoutes from './story.routes';
import followRoutes from './follow.routes';
import adminKycRoutes from './admin-kyc.routes';
import passwordResetRoutes from './password-reset.routes';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/user', userDashboardRoutes);
router.use('/wallets', walletRoutes);
router.use('/posts', postRoutes);
router.use('/games', gameRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/vtu', vtuRoutes);
router.use('/escrow', escrowRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/crypto', cryptoRoutes);
router.use('/reports', reportRoutes);
router.use('/withdrawal', withdrawalRoutes);
router.use('/', commentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/test', testRoutes);
router.use('/stories', storyRoutes);
router.use('/follow', followRoutes);
router.use('/admin-temp', adminKycRoutes); // TEMPORARY - DELETE AFTER USE
router.use('/listings', listingRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/password-reset', passwordResetRoutes);

// Force redeploy - Nov 21, 2025
export default router;

