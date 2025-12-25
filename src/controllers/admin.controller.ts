import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { UserStatus, KYCStatus, TransactionType, TransactionStatus, PostStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // User Management
  async getUsers(req: Request, res: Response) {
    try {
      const {
        status,
        search,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        status: status as UserStatus,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'createdAt' | 'lastActive' | 'username',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await adminService.getUsers(filters);
      
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateUserStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user status'
        });
      }

      const updatedUser = await adminService.updateUserStatus(userId, status, reason);
      
      return res.json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // KYC Management
  async getKYCVerifications(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status
      } = req.query;

      const result = await adminService.getKYCVerifications(
        parseInt(page as string),
        parseInt(limit as string),
        status as KYCStatus
      );
      
      res.json({
        success: true,
        data: result.verifications,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get KYC verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC verifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async verifyKYC(req: Request, res: Response) {
    try {
      const { kycId } = req.params;
      const { adminNotes } = req.body;

      const updatedKyc = await adminService.verifyKYC(kycId, adminNotes);
      
      res.json({
        success: true,
        message: 'KYC verification approved successfully',
        data: updatedKyc
      });
    } catch (error) {
      console.error('Verify KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify KYC',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async rejectKYC(req: Request, res: Response) {
    try {
      const { kycId } = req.params;
      const { reason, adminNotes } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const updatedKyc = await adminService.rejectKYC(kycId, reason, adminNotes);
      
      return res.json({
        success: true,
        message: 'KYC verification rejected successfully',
        data: updatedKyc
      });
    } catch (error) {
      console.error('Reject KYC error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject KYC',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Transaction Management
  async getTransactions(req: Request, res: Response) {
    try {
      const {
        type,
        status,
        userId,
        startDate,
        endDate,
        page = '1',
        limit = '20'
      } = req.query;

      const filters = {
        type: type as TransactionType,
        status: status as TransactionStatus,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await adminService.getTransactions(filters);
      
      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Post Management
  async getPosts(req: Request, res: Response) {
    try {
      const {
        status,
        authorId,
        flagged,
        page = '1',
        limit = '20'
      } = req.query;

      const filters = {
        status: status as PostStatus,
        authorId: authorId as string,
        flagged: flagged === 'true' ? true : flagged === 'false' ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await adminService.getPosts(filters);
      
      res.json({
        success: true,
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async moderatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const { action, reason } = req.body;

      if (!['approve', 'flag', 'remove'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid moderation action'
        });
      }

      const updatedPost = await adminService.moderatePost(postId, action, reason);
      
      return res.json({
        success: true,
        message: `Post ${action}d successfully`,
        data: updatedPost
      });
    } catch (error) {
      console.error('Moderate post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to moderate post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Reports Management - Redirect to dedicated report routes
  async getReports(req: Request, res: Response) {
    try {
      // Reports are now handled by dedicated report routes at /api/reports
      res.json({
        success: true,
        data: [],
        message: 'Reports are now managed through /api/reports endpoints'
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async resolveReport(req: Request, res: Response) {
    try {
      // This would be implemented when report system is added to the schema
      res.json({
        success: true,
        message: 'Report system not yet implemented in database schema'
      });
    } catch (error) {
      console.error('Resolve report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // System Configuration
  async getSystemConfig(req: Request, res: Response) {
    try {
      const config = await adminService.getSystemConfig();
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Get system config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateSystemConfig(req: Request, res: Response) {
    try {
      const updates = req.body;
      const config = await adminService.updateSystemConfig(updates);
      
      res.json({
        success: true,
        message: 'System configuration updated successfully',
        data: config
      });
    } catch (error) {
      console.error('Update system config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const { days = '30' } = req.query;
      const analytics = await adminService.getAnalytics(parseInt(days as string));
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all notifications for admin view
  async getAllNotifications(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, type, read } = req.query;
      
      const where: any = {};
      if (type && type !== 'all') {
        where.type = type;
      }
      if (read !== undefined) {
        where.read = read === 'true';
      }

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string)
      });

      return res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Get all notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await prisma.notification.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Broadcast Notifications
  async sendBroadcastNotification(req: Request, res: Response) {
    try {
      const { title, message, targetUsers } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      const result = await adminService.sendBroadcastNotification(title, message, targetUsers);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Send broadcast notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send broadcast notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Game Management - Redirect to dedicated game routes
  async getGames(req: Request, res: Response) {
    try {
      // Games are now handled by dedicated game routes at /api/games
      res.json({
        success: true,
        data: [],
        message: 'Games are now managed through /api/games endpoints'
      });
    } catch (error) {
      console.error('Get games error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch games',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createGame(req: Request, res: Response) {
    try {
      // This would be implemented when game system is fully developed
      res.json({
        success: true,
        message: 'Game management system not yet fully implemented'
      });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create game',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateGame(req: Request, res: Response) {
    try {
      // This would be implemented when game system is fully developed
      res.json({
        success: true,
        message: 'Game management system not yet fully implemented'
      });
    } catch (error) {
      console.error('Update game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update game',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteGame(req: Request, res: Response) {
    try {
      // This would be implemented when game system is fully developed
      res.json({
        success: true,
        message: 'Game management system not yet fully implemented'
      });
    } catch (error) {
      console.error('Delete game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete game',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateGameStatus(req: Request, res: Response) {
    try {
      // This would be implemented when game system is fully developed
      res.json({
        success: true,
        message: 'Game management system not yet fully implemented'
      });
    } catch (error) {
      console.error('Update game status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update game status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Withdrawal Management
  async getWithdrawals(req: Request, res: Response) {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const filters = {
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await adminService.getWithdrawals(filters);
      
      res.json({
        success: true,
        data: result.withdrawals,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawals',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async approveWithdrawal(req: Request, res: Response) {
    try {
      const { withdrawalId } = req.params;
      const adminId = (req as any).user.id;

      const result = await adminService.approveWithdrawal(withdrawalId, adminId);
      
      res.json({
        success: true,
        message: 'Withdrawal approved successfully',
        data: result
      });
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve withdrawal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async rejectWithdrawal(req: Request, res: Response) {
    try {
      const { withdrawalId } = req.params;
      const { reason } = req.body;
      const adminId = (req as any).user.id;

      const result = await adminService.rejectWithdrawal(withdrawalId, adminId, reason);
      
      res.json({
        success: true,
        message: 'Withdrawal rejected successfully',
        data: result
      });
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject withdrawal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWithdrawalStats(req: Request, res: Response) {
    try {
      const result = await adminService.getWithdrawalStats();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get withdrawal stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch withdrawal statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async bulkWithdrawalAction(req: Request, res: Response) {
    try {
      const { withdrawalIds, action } = req.body;
      const adminId = (req as any).user.id;

      if (!withdrawalIds || !Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal IDs are required'
        });
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Valid action (approve/reject) is required'
        });
      }

      const result = await adminService.bulkWithdrawalAction(withdrawalIds, action, adminId);
      
      return res.json({
        success: true,
        message: `${withdrawalIds.length} withdrawals ${action}d successfully`,
        data: result
      });
    } catch (error) {
      console.error('Bulk withdrawal action error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process bulk withdrawal action',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Verification Badge Management
  async verifyUser(req: Request, res: Response) {
    try {
      const { userId, days } = req.body;

      if (!userId || !days) {
        return res.status(400).json({
          success: false,
          message: 'User ID and days are required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(days));

      const badge = await prisma.verificationBadge.upsert({
        where: { userId },
        update: {
          status: 'verified',
          purchasedAt: new Date(),
          expiresAt
        },
        create: {
          userId,
          status: 'verified',
          purchasedAt: new Date(),
          expiresAt
        }
      });

      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: '✅ Verification Badge Activated!',
          message: `Congratulations! Your verification badge is now active for ${days} days.`
        }
      });

      return res.json({
        success: true,
        message: 'User verified successfully',
        data: badge
      });
    } catch (error) {
      console.error('Verify user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async removeVerification(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const badge = await prisma.verificationBadge.update({
        where: { userId },
        data: {
          status: 'none',
          expiresAt: new Date()
        }
      });

      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: '⚠️ Verification Badge Removed',
          message: 'Your verification badge has been removed by an administrator.'
        }
      });

      return res.json({
        success: true,
        message: 'Verification removed successfully',
        data: badge
      });
    } catch (error) {
      console.error('Remove verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getVerifiedUsers(req: Request, res: Response) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [badges, total] = await Promise.all([
        prisma.verificationBadge.findMany({
          where: {
            status: 'verified'
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string)
        }),
        prisma.verificationBadge.count({
          where: { status: 'verified' }
        })
      ]);

      return res.json({
        success: true,
        data: badges,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Get verified users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch verified users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const adminController = new AdminController();