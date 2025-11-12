import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// GET /api/admin/dashboard - Get admin dashboard stats
router.get('/dashboard', authenticate, adminOnly, asyncHandler(adminController.getDashboardStats.bind(adminController)));

// GET /api/admin/users - Get all users with filters
router.get('/users', authenticate, adminOnly, asyncHandler(adminController.getUsers.bind(adminController)));

// PUT /api/admin/users/:userId/status - Update user status
router.put('/users/:userId/status', authenticate, adminOnly, asyncHandler(adminController.updateUserStatus.bind(adminController)));

// GET /api/admin/kyc - Get KYC verifications
router.get('/kyc', authenticate, adminOnly, asyncHandler(adminController.getKYCVerifications.bind(adminController)));

// PUT /api/admin/kyc/:kycId/verify - Verify KYC
router.put('/kyc/:kycId/verify', authenticate, adminOnly, asyncHandler(adminController.verifyKYC.bind(adminController)));

// PUT /api/admin/kyc/:kycId/reject - Reject KYC
router.put('/kyc/:kycId/reject', authenticate, adminOnly, asyncHandler(adminController.rejectKYC.bind(adminController)));

// GET /api/admin/transactions - Get all transactions
router.get('/transactions', authenticate, adminOnly, asyncHandler(adminController.getTransactions.bind(adminController)));

// GET /api/admin/withdrawals - Get all withdrawal requests
router.get('/withdrawals', authenticate, adminOnly, asyncHandler(adminController.getWithdrawals.bind(adminController)));

// PUT /api/admin/withdrawals/:withdrawalId/approve - Approve withdrawal
router.put('/withdrawals/:withdrawalId/approve', authenticate, adminOnly, asyncHandler(adminController.approveWithdrawal.bind(adminController)));

// PUT /api/admin/withdrawals/:withdrawalId/reject - Reject withdrawal
router.put('/withdrawals/:withdrawalId/reject', authenticate, adminOnly, asyncHandler(adminController.rejectWithdrawal.bind(adminController)));

// GET /api/admin/withdrawals/stats - Get withdrawal statistics
router.get('/withdrawals/stats', authenticate, adminOnly, asyncHandler(adminController.getWithdrawalStats.bind(adminController)));

// POST /api/admin/withdrawals/bulk - Bulk approve/reject withdrawals
router.post('/withdrawals/bulk', authenticate, adminOnly, asyncHandler(adminController.bulkWithdrawalAction.bind(adminController)));

// GET /api/admin/posts - Get all posts with moderation
router.get('/posts', authenticate, adminOnly, asyncHandler(adminController.getPosts.bind(adminController)));

// PUT /api/admin/posts/:postId/moderate - Moderate post
router.put('/posts/:postId/moderate', authenticate, adminOnly, asyncHandler(adminController.moderatePost.bind(adminController)));

// GET /api/admin/reports - Get user reports
router.get('/reports', authenticate, adminOnly, asyncHandler(adminController.getReports.bind(adminController)));

// PUT /api/admin/reports/:reportId/resolve - Resolve report
router.put('/reports/:reportId/resolve', authenticate, adminOnly, asyncHandler(adminController.resolveReport.bind(adminController)));

// GET /api/admin/system-config - Get system configuration
router.get('/system-config', authenticate, adminOnly, asyncHandler(adminController.getSystemConfig.bind(adminController)));

// PUT /api/admin/system-config - Update system configuration
router.put('/system-config', authenticate, adminOnly, asyncHandler(adminController.updateSystemConfig.bind(adminController)));

// GET /api/admin/analytics - Get system analytics
router.get('/analytics', authenticate, adminOnly, asyncHandler(adminController.getAnalytics.bind(adminController)));

// GET /api/admin/notifications - Get all notifications for admin view
router.get('/notifications', authenticate, adminOnly, asyncHandler(adminController.getAllNotifications.bind(adminController)));

// POST /api/admin/notifications/broadcast - Send broadcast notification
router.post('/notifications/broadcast', authenticate, adminOnly, asyncHandler(adminController.sendBroadcastNotification.bind(adminController)));

// DELETE /api/admin/notifications/:id - Delete notification
router.delete('/notifications/:id', authenticate, adminOnly, asyncHandler(adminController.deleteNotification.bind(adminController)));

// ===== GAME MANAGEMENT ROUTES =====

// GET /api/admin/games - Get all games
router.get('/games', authenticate, adminOnly, asyncHandler(adminController.getGames.bind(adminController)));

// POST /api/admin/games - Create new game
router.post('/games', authenticate, adminOnly, asyncHandler(adminController.createGame.bind(adminController)));

// PUT /api/admin/games/:gameId - Update game
router.put('/games/:gameId', authenticate, adminOnly, asyncHandler(adminController.updateGame.bind(adminController)));

// DELETE /api/admin/games/:gameId - Delete game
router.delete('/games/:gameId', authenticate, adminOnly, asyncHandler(adminController.deleteGame.bind(adminController)));

// PUT /api/admin/games/:gameId/status - Update game status
router.put('/games/:gameId/status', authenticate, adminOnly, asyncHandler(adminController.updateGameStatus.bind(adminController)));

export default router;