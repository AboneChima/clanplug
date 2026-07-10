import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { pushService } from '../services/push.service';

export class PushController {
  // Subscribe to push notifications
  async subscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        res.status(400).json({
          success: false,
          message: 'Invalid subscription data'
        });
        return;
      }

      const result = await pushService.saveSubscription(userId, subscription);
      res.json(result);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to push notifications'
      });
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        res.status(400).json({
          success: false,
          message: 'Endpoint is required'
        });
        return;
      }

      const result = await pushService.removeSubscription(userId, endpoint);
      res.json(result);
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from push notifications'
      });
    }
  }

  // Send test notification
  async sendTest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const result = await pushService.sendNotificationToUser(userId, {
        title: 'Test Notification',
        message: 'This is a test push notification from ClanPlug!',
        url: '/',
        tag: 'test'
      });

      res.json(result);
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  }
}

export const pushController = new PushController();
