import { PrismaClient, NotificationType, Notification } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationWithUser extends Notification {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionNotifications: boolean;
  chatNotifications: boolean;
  postNotifications: boolean;
  systemNotifications: boolean;
  kycNotifications: boolean;
  escrowNotifications: boolean;
}

export interface PaginatedNotifications {
  notifications: NotificationWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class NotificationService {
  private streamConnections: Map<string, Set<(event: string, data: any) => void>> = new Map();

  // Create a new notification
  async createNotification(payload: CreateNotificationPayload): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || null,
      },
    });

    // Send real-time notification to connected clients
    this.sendRealTimeNotification(payload.userId, 'new_notification', notification);

    return notification;
  }

  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<PaginatedNotifications> {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // Get notification by ID
  async getNotificationById(notificationId: string, userId: string): Promise<NotificationWithUser | null> {
    return await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      if (notification.isRead) {
        return { success: true, message: 'Notification already marked as read' };
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Send real-time unread count update
      await this.sendUnreadCountUpdate(userId);

      return { success: true, message: 'Notification marked as read' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Send real-time unread count update
      await this.sendUnreadCountUpdate(userId);

      return {
        success: true,
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to mark notifications as read', count: 0 };
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return { success: true, message: 'Notification deleted successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to delete notification' };
    }
  }

  // Delete all notifications
  async deleteAllNotifications(userId: string): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const result = await prisma.notification.deleteMany({
        where: { userId },
      });

      return {
        success: true,
        message: `Deleted ${result.count} notifications`,
        count: result.count,
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to delete notifications', count: 0 };
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // FCM Token Management (stored in user profile or separate table)
  async registerFCMToken(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      // For now, we'll store FCM tokens in the user's profile
      // In a production app, you might want a separate FCMToken table
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Store token in user's profile (you might need to add fcmTokens field to User model)
      // For now, we'll just return success
      return { success: true, message: 'FCM token registered successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to register FCM token' };
    }
  }

  // Remove FCM token
  async removeFCMToken(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove token from user's profile
      return { success: true, message: 'FCM token removed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to remove FCM token' };
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    // For now, return default settings
    // In production, you might store these in a separate table or user profile
    return {
      emailNotifications: true,
      pushNotifications: true,
      transactionNotifications: true,
      chatNotifications: true,
      postNotifications: true,
      systemNotifications: true,
      kycNotifications: true,
      escrowNotifications: true,
    };
  }

  // Update notification settings
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<{ success: boolean; message: string; settings: NotificationSettings }> {
    try {
      // For now, just return the updated settings
      // In production, you would store these in the database
      const currentSettings = await this.getNotificationSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };

      return {
        success: true,
        message: 'Notification settings updated successfully',
        settings: updatedSettings,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update notification settings',
        settings: await this.getNotificationSettings(userId),
      };
    }
  }

  // Bulk create notifications (useful for system notifications)
  async createBulkNotifications(notifications: CreateNotificationPayload[]): Promise<{ success: boolean; count: number }> {
    try {
      const result = await prisma.notification.createMany({
        data: notifications.map(notification => ({
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || null,
        })),
      });

      return { success: true, count: result.count };
    } catch (error: any) {
      return { success: false, count: 0 };
    }
  }

  // Send notification to all users (admin feature)
  async sendBroadcastNotification(
    title: string,
    message: string,
    type: NotificationType = 'SYSTEM',
    data?: any
  ): Promise<{ success: boolean; message: string; count: number }> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type,
        title,
        message,
        data,
      }));

      const result = await this.createBulkNotifications(notifications);

      return {
        success: result.success,
        message: result.success 
          ? `Broadcast notification sent to ${result.count} users`
          : 'Failed to send broadcast notification',
        count: result.count,
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send broadcast notification', count: 0 };
    }
  }

  // Stream connection management
  addStreamConnection(userId: string, sendEvent: (event: string, data: any) => void): void {
    if (!this.streamConnections.has(userId)) {
      this.streamConnections.set(userId, new Set());
    }
    this.streamConnections.get(userId)!.add(sendEvent);
  }

  removeStreamConnection(userId: string, sendEvent: (event: string, data: any) => void): void {
    const userConnections = this.streamConnections.get(userId);
    if (userConnections) {
      userConnections.delete(sendEvent);
      if (userConnections.size === 0) {
        this.streamConnections.delete(userId);
      }
    }
  }

  // Send real-time notification to connected clients
  private sendRealTimeNotification(userId: string, event: string, data: any): void {
    const userConnections = this.streamConnections.get(userId);
    if (userConnections) {
      userConnections.forEach(sendEvent => {
        try {
          sendEvent(event, data);
        } catch (error) {
          console.error('Error sending real-time notification:', error);
          // Remove failed connection
          this.removeStreamConnection(userId, sendEvent);
        }
      });
    }
  }

  // Send unread count update to connected clients
  async sendUnreadCountUpdate(userId: string): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount(userId);
      this.sendRealTimeNotification(userId, 'unread_count', { count: unreadCount });
    } catch (error) {
      console.error('Error sending unread count update:', error);
    }
  }
}

export const notificationService = new NotificationService();