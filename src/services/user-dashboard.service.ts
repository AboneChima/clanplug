import { prisma } from '../config/database';
import { TransactionStatus, TransactionType, PostStatus } from '@prisma/client';

export interface UserDashboardStats {
  walletBalance: {
    total: number;
    byCurrency: Record<string, number>;
  };
  transactions: {
    total: number;
    thisMonth: number;
    successful: number;
    pending: number;
    recentTransactions: Array<{
      id: string;
      type: TransactionType;
      amount: number;
      currency: string;
      status: TransactionStatus;
      createdAt: Date;
      description?: string;
    }>;
  };
  posts: {
    total: number;
    active: number;
    sold: number;
    views: number;
    likes: number;
  };
  escrow: {
    active: number;
    completed: number;
    totalValue: number;
  };
  rewards: {
    points: number;
    level: string;
    nextLevelPoints: number;
  };
  activity: {
    lastLogin: Date | null;
    accountAge: number; // days since registration
    kycStatus: string;
    isVerified: boolean;
  };
}

export class UserDashboardService {
  async getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get wallet balances
    const wallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: { currency: true, balance: true }
    });

    // Calculate total in NGN equivalent (1 LMC = 1 NGN, 1 USD = 1500 NGN)
    const walletBalance = {
      total: wallets.reduce((sum, wallet) => {
        const balance = Number(wallet.balance);
        if (wallet.currency === 'NGN' || wallet.currency === 'LMC') {
          return sum + balance; // 1 LMC = 1 NGN
        } else if (wallet.currency === 'USD') {
          return sum + (balance * 1500); // 1 USD = 1500 NGN (approximate)
        }
        return sum;
      }, 0),
      byCurrency: wallets.reduce((acc, wallet) => {
        acc[wallet.currency] = Number(wallet.balance);
        return acc;
      }, {} as Record<string, number>)
    };

    // Get transaction statistics
    const [
      totalTransactions,
      thisMonthTransactions,
      successfulTransactions,
      pendingTransactions,
      recentTransactions
    ] = await Promise.all([
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.count({ 
        where: { 
          userId, 
          createdAt: { gte: startOfMonth } 
        } 
      }),
      prisma.transaction.count({ 
        where: { 
          userId, 
          status: TransactionStatus.COMPLETED 
        } 
      }),
      prisma.transaction.count({ 
        where: { 
          userId, 
          status: TransactionStatus.PENDING 
        } 
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          description: true
        }
      })
    ]);

    // Get post statistics
    const [
      totalPosts,
      activePosts,
      soldPosts,
      postViews,
      postLikes
    ] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.post.count({ 
        where: { 
          userId, 
          status: PostStatus.ACTIVE 
        } 
      }),
      prisma.post.count({ 
        where: { 
          userId, 
          soldAt: { not: null } 
        } 
      }),
      prisma.post.aggregate({
        where: { userId },
        _sum: { viewCount: true }
      }),
      prisma.post.aggregate({
        where: { userId },
        _sum: { likeCount: true }
      })
    ]);

    // Get escrow statistics
    const [activeEscrows, completedEscrows, escrowValue] = await Promise.all([
      prisma.escrow.count({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ],
          status: 'FUNDED'
        }
      }),
      prisma.escrow.count({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ],
          status: 'RELEASED'
        }
      }),
      prisma.escrow.aggregate({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ],
          status: 'FUNDED'
        },
        _sum: { amount: true }
      })
    ]);

    // Calculate rewards (simple point system based on activity)
    const rewardPoints = (successfulTransactions * 10) + (totalPosts * 25) + (completedEscrows * 50);
    const level = rewardPoints < 100 ? 'Bronze' : 
                  rewardPoints < 500 ? 'Silver' : 
                  rewardPoints < 1000 ? 'Gold' : 'Platinum';
    const nextLevelPoints = rewardPoints < 100 ? 100 - rewardPoints :
                           rewardPoints < 500 ? 500 - rewardPoints :
                           rewardPoints < 1000 ? 1000 - rewardPoints : 0;

    // Calculate account age
    const accountAge = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      walletBalance,
      transactions: {
        total: totalTransactions,
        thisMonth: thisMonthTransactions,
        successful: successfulTransactions,
        pending: pendingTransactions,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          currency: t.currency,
          status: t.status,
          createdAt: t.createdAt,
          description: t.description || undefined
        }))
      },
      posts: {
        total: totalPosts,
        active: activePosts,
        sold: soldPosts,
        views: postViews._sum.viewCount || 0,
        likes: postLikes._sum.likeCount || 0
      },
      escrow: {
        active: activeEscrows,
        completed: completedEscrows,
        totalValue: Number(escrowValue._sum?.amount || 0)
      },
      rewards: {
        points: rewardPoints,
        level,
        nextLevelPoints
      },
      activity: {
        lastLogin: user.lastLoginAt,
        accountAge,
        kycStatus: 'NOT_SUBMITTED', // Simplified for now
        isVerified: false // Simplified for now
      }
    };
  }

  async getUserRecentActivity(userId: string, limit: number = 10) {
    // Get recent transactions, posts, and escrow activities
    const [recentTransactions, recentPosts, recentEscrows] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          description: true
        }
      }),
      prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          status: true,
          createdAt: true,
          viewCount: true
        }
      }),
      prisma.escrow.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          post: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    // Combine and sort all activities
    const activities = [
      ...recentTransactions.map(t => ({
        id: t.id,
        type: 'transaction' as const,
        title: `${t.type} Transaction`,
        description: t.description || `${t.type} of ${t.amount} ${t.currency}`,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt
      })),
      ...recentPosts.map(p => ({
        id: p.id,
        type: 'post' as const,
        title: p.title,
        description: `Listed for ${p.price} ${p.currency}`,
        amount: Number(p.price || 0),
        currency: p.currency || 'NGN',
        status: p.status,
        createdAt: p.createdAt
      })),
      ...recentEscrows.map(e => ({
        id: e.id,
        type: 'escrow' as const,
        title: `Escrow: ${e.post?.title || 'Transaction'}`,
        description: `Escrow transaction of ${e.amount} ${e.currency}`,
        amount: Number(e.amount),
        currency: e.currency,
        status: e.status,
        createdAt: e.createdAt
      }))
    ];

    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const userDashboardService = new UserDashboardService();