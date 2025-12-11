import { PrismaClient, UserStatus, KYCStatus, PostStatus, TransactionStatus, TransactionType } from '@prisma/client';
import { prisma } from '../config/database';

// Type definitions for admin operations
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
  };
  transactions: {
    total: number;
    totalVolume: number;
    successfulTransactions: number;
    pendingTransactions: number;
    thisMonthVolume: number;
  };
  posts: {
    total: number;
    published: number;
    flagged: number;
    thisMonthPosts: number;
  };
  kyc: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export interface UserFilters {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastActive' | 'username';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PostFilters {
  status?: PostStatus;
  authorId?: string;
  flagged?: boolean;
  page?: number;
  limit?: number;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  withdrawalFeePercentage: number; // Changed back to percentage fee
  escrowFeePercentage: number;
  vtuFeePercentage: number;
  supportEmail: string;
  supportPhone: string;
  announcementMessage?: string;
}

export interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  transactionVolume: Array<{ date: string; volume: number }>;
  revenueData: Array<{ date: string; revenue: number }>;
  topUsers: Array<{ id: string; username: string; totalTransactions: number; totalVolume: number }>;
  popularGames: Array<{ id: string; name: string; totalPlayers: number; totalTransactions: number }>;
}

export class AdminService {
  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User statistics
    const [totalUsers, activeUsers, suspendedUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } })
    ]);

    // Transaction statistics
    const [totalTransactions, successfulTransactions, pendingTransactions] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: TransactionStatus.COMPLETED } }),
      prisma.transaction.count({ where: { status: TransactionStatus.PENDING } })
    ]);

    const [totalVolumeResult, thisMonthVolumeResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { status: TransactionStatus.COMPLETED },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { 
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      })
    ]);

    // Post statistics
    const [totalPosts, publishedPosts, reportedPosts, thisMonthPosts] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.ACTIVE } }),
      prisma.post.count({ where: { reports: { some: {} } } }),
      prisma.post.count({ where: { createdAt: { gte: startOfMonth } } })
    ]);

    // KYC statistics
    const [totalKyc, pendingKyc, verifiedKyc, rejectedKyc] = await Promise.all([
      prisma.kYCVerification.count(),
      prisma.kYCVerification.count({ where: { status: KYCStatus.PENDING } }),
      prisma.kYCVerification.count({ where: { status: KYCStatus.APPROVED } }),
      prisma.kYCVerification.count({ where: { status: KYCStatus.REJECTED } })
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth
      },
      transactions: {
        total: totalTransactions,
        totalVolume: totalVolumeResult._sum.amount?.toNumber() || 0,
        successfulTransactions,
        pendingTransactions,
        thisMonthVolume: thisMonthVolumeResult._sum.amount?.toNumber() || 0
      },
      posts: {
        total: totalPosts,
        published: publishedPosts,
        flagged: reportedPosts,
        thisMonthPosts
      },
      kyc: {
        total: totalKyc,
        pending: pendingKyc,
        verified: verifiedKyc,
        rejected: rejectedKyc
      }
    };
  }

  // User Management
  async getUsers(filters: UserFilters = {}) {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          wallets: {
            select: {
              balance: true
            }
          },
          kycVerifications: {
            select: {
              status: true
            }
          },
          _count: {
            select: {
              posts: true,
              transactions: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserStatus(userId: string, status: UserStatus, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        updatedAt: true
      }
    });

    // Send notification to user about status change
    const statusMessages = {
      ACTIVE: {
        title: '✅ Account Activated',
        message: 'Your account has been activated. You can now access all features.'
      },
      SUSPENDED: {
        title: '⚠️ Account Suspended',
        message: `Your account has been suspended. ${reason || 'Please contact support for more information.'}`
      },
      BANNED: {
        title: '🚫 Account Banned',
        message: `Your account has been permanently banned. ${reason || 'Please contact support if you believe this is an error.'}`
      },
      PENDING_VERIFICATION: {
        title: '⏳ Account Pending',
        message: 'Your account is pending verification.'
      }
    };

    const notification = statusMessages[status];
    if (notification) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          title: notification.title,
          message: notification.message,
          data: {
            oldStatus: user.status,
            newStatus: status,
            reason: reason || null,
            changedAt: new Date().toISOString()
          }
        }
      });
    }

    return updatedUser;
  }

  // KYC Management
  async getKYCVerifications(page = 1, limit = 20, status?: KYCStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [verifications, total] = await Promise.all([
      prisma.kYCVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        }
      }),
      prisma.kYCVerification.count({ where })
    ]);

    return {
      verifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async verifyKYC(kycId: string, adminNotes?: string) {
    const kyc = await prisma.kYCVerification.findUnique({
      where: { id: kycId },
      include: { user: true }
    });

    if (!kyc) {
      throw new Error('KYC verification not found');
    }

    if (kyc.status !== KYCStatus.PENDING) {
      throw new Error('KYC verification is not in pending status');
    }

    const updateData: any = {
      status: KYCStatus.APPROVED,
      verifiedAt: new Date()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedKyc = await prisma.kYCVerification.update({
      where: { id: kycId },
      data: updateData
    });

    // Update user's KYC status
    await prisma.user.update({
      where: { id: kyc.userId },
      data: { isKYCVerified: true }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        type: 'KYC',
        title: 'KYC Approved! ✅',
        message: 'Your KYC verification has been approved. You can now post on the marketplace and access all features.',
        data: { kycId: kyc.id }
      }
    });

    return updatedKyc;
  }

  async rejectKYC(kycId: string, reason: string, adminNotes?: string) {
    const kyc = await prisma.kYCVerification.findUnique({
      where: { id: kycId }
    });

    if (!kyc) {
      throw new Error('KYC verification not found');
    }

    if (kyc.status !== KYCStatus.PENDING) {
      throw new Error('KYC verification is not in pending status');
    }

    const updateData: any = {
      status: KYCStatus.REJECTED,
      rejectionReason: reason
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedKyc = await prisma.kYCVerification.update({
      where: { id: kycId },
      data: updateData
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        type: 'KYC',
        title: 'KYC Rejected ❌',
        message: `Your KYC verification was rejected. Reason: ${reason}. Please resubmit with correct information.`,
        data: { kycId: kyc.id, reason }
      }
    });

    return updatedKyc;
  }

  // Transaction Management
  async getTransactions(filters: TransactionFilters = {}) {
    const {
      type,
      status,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Post Management
  async getPosts(filters: PostFilters = {}) {
    const {
      status,
      authorId,
      flagged,
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (authorId) where.userId = authorId;
    if (flagged !== undefined) where.flagged = flagged;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async moderatePost(postId: string, action: 'approve' | 'flag' | 'remove', reason?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData = {
          status: PostStatus.ACTIVE,
          flagged: false
        };
        break;
      case 'flag':
        updateData = {
          flagged: true,
          flagReason: reason
        };
        break;
      case 'remove':
        updateData = {
          status: PostStatus.DELETED,
          flagged: true,
          flagReason: reason
        };
        break;
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData
    });

    return updatedPost;
  }

  // System Configuration
  async getSystemConfig(): Promise<SystemConfig> {
    const configs = await prisma.systemConfig.findMany({
      where: { isActive: true }
    });
    
    // Convert key-value pairs to SystemConfig object
    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as any);

    return {
      maintenanceMode: configMap.maintenanceMode === 'true' || false,
      registrationEnabled: configMap.registrationEnabled !== 'false',
      kycRequired: configMap.kycRequired === 'true' || false,
      minWithdrawalAmount: parseFloat(configMap.minWithdrawalAmount) || 1000,
      maxWithdrawalAmount: parseFloat(configMap.maxWithdrawalAmount) || 1000000,
      withdrawalFeePercentage: parseFloat(configMap.withdrawalFeePercentage) || 0.5, // 0.5% fee
      escrowFeePercentage: parseFloat(configMap.escrowFeePercentage) || 0.5,
      vtuFeePercentage: parseFloat(configMap.vtuFeePercentage) || 0.5,
      supportEmail: configMap.supportEmail || 'support@lordmoon.com',
      supportPhone: configMap.supportPhone || '+234-000-000-0000',
      announcementMessage: configMap.announcementMessage || undefined
    };
  }

  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    // Update each configuration key-value pair
    const updatePromises = Object.entries(updates).map(async ([key, value]) => {
      if (value !== undefined) {
        const stringValue = typeof value === 'boolean' ? value.toString() : value.toString();
        
        await prisma.systemConfig.upsert({
          where: { key },
          update: { 
            value: stringValue,
            updatedAt: new Date()
          },
          create: {
            key,
            value: stringValue,
            description: `System configuration for ${key}`,
            isActive: true
          }
        });
      }
    });

    await Promise.all(updatePromises);

    // Return the updated configuration
    return this.getSystemConfig();
  }

  // Analytics
  async getAnalytics(days = 30): Promise<AnalyticsData> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User growth data
    const userGrowth = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "User"
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: string; count: bigint }>;

    // Transaction volume data
    const transactionVolume = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(amount) as volume
      FROM "Transaction"
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: string; volume: bigint }>;

    // Revenue data (fees collected)
    const revenueData = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, SUM(fee) as revenue
      FROM "Transaction"
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: string; revenue: bigint }>;

    // Top users by transaction volume
    const topUsers = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            transactions: true
          }
        },
        transactions: {
          where: {
            status: TransactionStatus.COMPLETED
          },
          select: {
            amount: true
          }
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      }
    });

    return {
      userGrowth: userGrowth.map(item => ({
        date: item.date,
        count: Number(item.count)
      })),
      transactionVolume: transactionVolume.map(item => ({
        date: item.date,
        volume: Number(item.volume)
      })),
      revenueData: revenueData.map(item => ({
        date: item.date,
        revenue: Number(item.revenue)
      })),
      topUsers: topUsers.map(user => ({
        id: user.id,
        username: user.username,
        totalTransactions: user._count.transactions,
        totalVolume: user.transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0)
      })),
      popularGames: [] // Will be implemented when game system is ready
    };
  }

  // Broadcast Notifications
  async sendBroadcastNotification(title: string, message: string, targetUsers?: string[]) {
    const where = targetUsers ? { id: { in: targetUsers } } : {};
    
    const users = await prisma.user.findMany({
      where,
      select: { id: true }
    });

    const notifications = users.map(user => ({
      userId: user.id,
      title,
      message,
      type: 'SYSTEM' as const
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    return {
      success: true,
      sentTo: users.length,
      message: `Broadcast notification sent to ${users.length} users`
    };
  }

  // Withdrawal Management
  async getWithdrawals(filters: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      type: TransactionType.WITHDRAWAL
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      username: withdrawal.user.username,
      email: withdrawal.user.email,
      amount: withdrawal.amount.toNumber(),
      bankName: (withdrawal.metadata as any)?.bankName || '',
      accountNumber: (withdrawal.metadata as any)?.accountNumber || '',
      accountName: (withdrawal.metadata as any)?.accountName || '',
      remarks: (withdrawal.metadata as any)?.remarks || '',
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
      processedAt: withdrawal.updatedAt.toISOString(),
      processedBy: (withdrawal.metadata as any)?.processedBy || null
    }));

    return {
      withdrawals: formattedWithdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await prisma.transaction.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    if (withdrawal.status !== TransactionStatus.PENDING) {
      throw new Error('Withdrawal request is not pending');
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.transaction.update({
      where: { id: withdrawalId },
      data: {
        status: TransactionStatus.COMPLETED,
        metadata: {
          ...(withdrawal.metadata as any || {}),
          processedBy: adminId,
          processedAt: new Date().toISOString(),
          approvedBy: adminId
        }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Approved',
        message: `Your LMC withdrawal of ₦${withdrawal.amount.toNumber().toLocaleString()} has been approved and processed.`,
        type: 'TRANSACTION',
        data: {
          transactionId: withdrawalId,
          amount: withdrawal.amount.toNumber()
        }
      }
    });

    return updatedWithdrawal;
  }

  async getWithdrawalStats() {
    const stats = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.WITHDRAWAL
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    const statusStats = await prisma.transaction.groupBy({
      by: ['status'],
      where: {
        type: TransactionType.WITHDRAWAL
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    const result = {
      totalPending: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalAmount: stats._sum.amount?.toNumber() || 0,
      pendingAmount: 0,
      approvedAmount: 0
    };

    statusStats.forEach(stat => {
      const count = stat._count.id;
      const amount = stat._sum.amount?.toNumber() || 0;

      switch (stat.status) {
        case TransactionStatus.PENDING:
          result.totalPending = count;
          result.pendingAmount = amount;
          break;
        case TransactionStatus.COMPLETED:
          result.totalApproved = count;
          result.approvedAmount = amount;
          break;
        case TransactionStatus.FAILED:
          result.totalRejected = count;
          break;
      }
    });

    return result;
  }

  async bulkWithdrawalAction(withdrawalIds: string[], action: 'approve' | 'reject', adminId: string) {
    const results = [];
    const errors = [];

    for (const withdrawalId of withdrawalIds) {
      try {
        if (action === 'approve') {
          const result = await this.approveWithdrawal(withdrawalId, adminId);
          results.push(result);
        } else {
          const result = await this.rejectWithdrawal(withdrawalId, adminId, 'Bulk rejection');
          results.push(result);
        }
      } catch (error) {
        errors.push({
          withdrawalId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successful: results.length,
      failed: errors.length,
      errors: errors
    };
  }

  async rejectWithdrawal(withdrawalId: string, adminId: string, reason?: string) {
    const withdrawal = await prisma.transaction.findUnique({
      where: { id: withdrawalId },
      include: { user: true }
    });

    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    if (withdrawal.status !== TransactionStatus.PENDING) {
      throw new Error('Withdrawal request is not pending');
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.transaction.update({
      where: { id: withdrawalId },
      data: {
        status: TransactionStatus.FAILED,
        metadata: {
          ...(withdrawal.metadata as any || {}),
          processedBy: adminId,
          processedAt: new Date().toISOString(),
          rejectedBy: adminId,
          rejectionReason: reason || 'No reason provided'
        }
      }
    });

    // Refund the amount to user's wallet
    await prisma.wallet.update({
      where: { 
        userId_currency: {
          userId: withdrawal.userId,
          currency: 'LMC'
        }
      },
      data: {
        balance: {
          increment: withdrawal.amount
        }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Rejected',
        message: `Your LMC withdrawal of ₦${withdrawal.amount.toNumber().toLocaleString()} has been rejected. ${reason ? `Reason: ${reason}` : ''} The amount has been refunded to your wallet.`,
        type: 'TRANSACTION',
        data: {
          transactionId: withdrawalId,
          amount: withdrawal.amount.toNumber(),
          reason: reason || 'No reason provided'
        }
      }
    });

    return updatedWithdrawal;
  }
}

export const adminService = new AdminService();