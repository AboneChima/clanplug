import { Request, Response } from 'express';
import { notificationService, NotificationSettings } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

class NotificationController {
  // GET /api/notifications - Get user notifications
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationService.getUserNotifications(userId, page, limit, unreadOnly);

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  }

  // GET /api/notifications/:notificationId - Get notification by ID
  async getNotificationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      const notification = await notificationService.getNotificationById(notificationId, userId);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
        return;
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification',
        error: error.message,
      });
    }
  }

  // PUT /api/notifications/:notificationId/read - Mark notification as read
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      const result = await notificationService.markAsRead(notificationId, userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  }

  // PUT /api/notifications/read-all - Mark all notifications as read
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: result.success,
        message: result.message,
        data: { count: result.count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message,
      });
    }
  }

  // DELETE /api/notifications/:notificationId - Delete notification
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      const result = await notificationService.deleteNotification(notificationId, userId);

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  }

  // DELETE /api/notifications - Delete all notifications
  async deleteAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const result = await notificationService.deleteAllNotifications(userId);

      res.json({
        success: result.success,
        message: result.message,
        data: { count: result.count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete notifications',
        error: error.message,
      });
    }
  }

  // GET /api/notifications/unread-count - Get unread notification count
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message,
      });
    }
  }

  // POST /api/notifications/fcm-token - Register FCM token
  async registerFCMToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
        return;
      }

      const result = await notificationService.registerFCMToken(userId, token);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to register FCM token',
        error: error.message,
      });
    }
  }

  // DELETE /api/notifications/fcm-token - Remove FCM token
  async removeFCMToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
        return;
      }

      const result = await notificationService.removeFCMToken(userId, token);

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to remove FCM token',
        error: error.message,
      });
    }
  }

  // GET /api/notifications/settings - Get notification settings
  async getNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const settings = await notificationService.getNotificationSettings(userId);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings',
        error: error.message,
      });
    }
  }

  // PUT /api/notifications/settings - Update notification settings
  async updateNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const settings = req.body as Partial<NotificationSettings>;

      // Validate settings
      const validKeys = [
        'emailNotifications',
        'pushNotifications',
        'transactionNotifications',
        'chatNotifications',
        'postNotifications',
        'systemNotifications',
        'kycNotifications',
        'escrowNotifications',
      ];

      const invalidKeys = Object.keys(settings).filter(key => !validKeys.includes(key));
      if (invalidKeys.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid settings keys: ${invalidKeys.join(', ')}`,
        });
        return;
      }

      // Validate that all values are booleans
      const invalidValues = Object.entries(settings).filter(([key, value]) => typeof value !== 'boolean');
      if (invalidValues.length > 0) {
        res.status(400).json({
          success: false,
          message: 'All notification settings must be boolean values',
        });
        return;
      }

      const result = await notificationService.updateNotificationSettings(userId, settings);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        data: result.settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings',
        error: error.message,
      });
    }
  }

  // POST /api/notifications/broadcast - Send broadcast notification (admin only)
  async sendBroadcastNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, message, type, data } = req.body;

      if (!title || !message) {
        res.status(400).json({
          success: false,
          message: 'Title and message are required',
        });
        return;
      }

      const result = await notificationService.sendBroadcastNotification(title, message, type, data);

      res.json({
        success: result.success,
        message: result.message,
        data: { count: result.count },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to send broadcast notification',
        error: error.message,
      });
    }
  }

  // GET /api/notifications/stream - Real-time notification stream (SSE)
  async streamNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    });

    // Send initial connection event
    const sendEvent = (event: string, data: any) => {
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error writing SSE event:', error);
      }
    };

    sendEvent('connected', { 
      message: 'Connected to notification stream', 
      userId, 
      timestamp: new Date().toISOString() 
    });

    // Send initial unread count
    try {
      const unreadCount = await notificationService.getUnreadCount(userId);
      sendEvent('unread_count', { count: unreadCount });
    } catch (error) {
      console.error('Error getting initial unread count:', error);
    }

    // Store the connection for this user
    notificationService.addStreamConnection(userId, sendEvent);

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      sendEvent('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000);

    // Handle client disconnect and cleanup
    const cleanup = () => {
      notificationService.removeStreamConnection(userId, sendEvent);
      clearInterval(heartbeat);
      res.end();
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
  }
}

export const notificationController = new NotificationController();