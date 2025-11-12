import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { notificationController } from '../controllers/notification.controller';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import config from '../config/config';
import { prisma } from '../config/database';

const router = Router();

router.get('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📡 SSE stream request received:', {
      hasQueryToken: !!req.query.token,
      hasAuthHeader: !!req.headers.authorization,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });

    // Handle authentication from query parameter or header
    let token = req.query.token as string;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('❌ SSE authentication failed: No token provided');
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    console.log('✅ SSE token verified for user:', decoded.userId);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isKYCVerified: user.isKYCVerified,
      status: user.status
    };

    // Call the stream controller
    return notificationController.streamNotifications(req as AuthenticatedRequest, res);
  } catch (error) {
    console.error('❌ SSE authentication error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      hasToken: !!req.query.token || !!req.headers.authorization
    });
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
});

// Apply authentication middleware to all other routes
router.use(authenticate);

// GET /api/notifications - Get user notifications
router.get('/', asyncHandler(notificationController.getNotifications.bind(notificationController)));

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount.bind(notificationController)));

// POST /api/notifications/test - Create test notification (for testing purposes)
router.post('/test', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, type = 'info', data } = req.body;
    const userId = req.user!.id;

    if (!title || !message) {
      res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
      return;
    }

    // Create notification using the notification service
    const { notificationService } = await import('../services/notification.service');
    
    const notification = await notificationService.createNotification({
      userId,
      title,
      message,
      type,
      data: data || {},
    });

    res.json({
      success: true,
      message: 'Test notification created successfully',
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message,
    });
  }
}));

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', asyncHandler(notificationController.markAsRead.bind(notificationController)));

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', asyncHandler(notificationController.markAllAsRead.bind(notificationController)));

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', asyncHandler(notificationController.deleteNotification.bind(notificationController)));

export default router;