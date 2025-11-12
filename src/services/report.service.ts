import { PrismaClient, Report } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface CreateReportPayload {
  reason: string;
  description?: string;
}

export interface ReportWithDetails extends Report {
  reportedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  reportedUser?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  post?: {
    id: string;
    title?: string;
    description: string;
    images?: string[];
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface ReportFilters {
  status?: string;
  reason?: string;
  reportedUserId?: string;
  postId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export class ReportService {
  /**
   * Report a post
   */
  async reportPost(
    postId: string,
    reportedById: string,
    payload: CreateReportPayload
  ): Promise<{
    success: boolean;
    report?: Report;
    message: string;
    error?: string;
  }> {
    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { user: true }
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
          error: 'POST_NOT_FOUND'
        };
      }

      // Check if user is trying to report their own post
      if (post.userId === reportedById) {
        return {
          success: false,
          message: 'You cannot report your own post',
          error: 'CANNOT_REPORT_OWN_POST'
        };
      }

      // Check if user has already reported this post
      const existingReport = await prisma.report.findFirst({
        where: {
          postId,
          reportedById,
          status: { in: ['PENDING', 'REVIEWED'] }
        }
      });

      if (existingReport) {
        return {
          success: false,
          message: 'You have already reported this post',
          error: 'ALREADY_REPORTED'
        };
      }

      // Create the report
      const report = await prisma.report.create({
        data: {
          postId,
          reportedById,
          reportedUserId: post.userId,
          reason: payload.reason,
          description: payload.description,
          status: 'PENDING'
        }
      });

      // Send notification to admins (you can implement admin notification logic here)
      // For now, we'll just create a notification for the post author
      await notificationService.createNotification({
        userId: post.userId,
        type: 'SYSTEM',
        title: 'Content Report',
        message: 'Your post has been reported and is under review.',
        data: {
          postId,
          reportId: report.id
        }
      });

      return {
        success: true,
        report,
        message: 'Post reported successfully'
      };
    } catch (error) {
      console.error('Error reporting post:', error);
      return {
        success: false,
        message: 'Failed to report post',
        error: 'REPORT_POST_ERROR'
      };
    }
  }

  /**
   * Report a user
   */
  async reportUser(
    reportedUserId: string,
    reportedById: string,
    payload: CreateReportPayload
  ): Promise<{
    success: boolean;
    report?: Report;
    message: string;
    error?: string;
  }> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: reportedUserId }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        };
      }

      // Check if user is trying to report themselves
      if (reportedUserId === reportedById) {
        return {
          success: false,
          message: 'You cannot report yourself',
          error: 'CANNOT_REPORT_SELF'
        };
      }

      // Check if user has already reported this user
      const existingReport = await prisma.report.findFirst({
        where: {
          reportedUserId,
          reportedById,
          postId: null, // User report, not post report
          status: { in: ['PENDING', 'REVIEWED'] }
        }
      });

      if (existingReport) {
        return {
          success: false,
          message: 'You have already reported this user',
          error: 'ALREADY_REPORTED'
        };
      }

      // Create the report
      const report = await prisma.report.create({
        data: {
          reportedUserId,
          reportedById,
          reason: payload.reason,
          description: payload.description,
          status: 'PENDING'
        }
      });

      // Send notification to the reported user
      await notificationService.createNotification({
        userId: reportedUserId,
        type: 'SYSTEM',
        title: 'Account Report',
        message: 'Your account has been reported and is under review.',
        data: {
          reportId: report.id
        }
      });

      return {
        success: true,
        report,
        message: 'User reported successfully'
      };
    } catch (error) {
      console.error('Error reporting user:', error);
      return {
        success: false,
        message: 'Failed to report user',
        error: 'REPORT_USER_ERROR'
      };
    }
  }

  /**
   * Get reports with filtering and pagination (Admin only)
   */
  async getReports(
    filters: ReportFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    reports: ReportWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      reason,
      reportedUserId,
      postId,
      startDate,
      endDate
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (reason) {
      where.reason = { contains: reason, mode: 'insensitive' };
    }

    if (reportedUserId) {
      where.reportedUserId = reportedUserId;
    }

    if (postId) {
      where.postId = postId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                    lastName: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ]);

    return {
      reports: reports as ReportWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<ReportWithDetails | null> {
    return prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reportedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            images: true,
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    }) as Promise<ReportWithDetails | null>;
  }

  /**
   * Update report status (Admin only)
   */
  async updateReportStatus(
    reportId: string,
    status: string,
    adminNotes?: string
  ): Promise<{
    success: boolean;
    report?: Report;
    message: string;
    error?: string;
  }> {
    try {
      const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
      
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          message: 'Invalid status',
          error: 'INVALID_STATUS'
        };
      }

      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          reportedUser: true,
          post: { include: { user: true } }
        }
      });

      if (!report) {
        return {
          success: false,
          message: 'Report not found',
          error: 'REPORT_NOT_FOUND'
        };
      }

      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          status,
          adminNotes,
          resolvedAt: status === 'RESOLVED' ? new Date() : null
        }
      });

      // Send notification to the reporter and reported user
      if (status === 'RESOLVED' || status === 'DISMISSED') {
        // Notify the reporter
        await notificationService.createNotification({
          userId: report.reportedById,
          type: 'SYSTEM',
          title: 'Report Update',
          message: `Your report has been ${status.toLowerCase()}.`,
          data: {
            reportId: report.id,
            status
          }
        });

        // Notify the reported user if applicable
        if (report.reportedUserId) {
          await notificationService.createNotification({
            userId: report.reportedUserId,
            type: 'SYSTEM',
            title: 'Report Update',
            message: `A report against you has been ${status.toLowerCase()}.`,
            data: {
              reportId: report.id,
              status
            }
          });
        }
      }

      return {
        success: true,
        report: updatedReport,
        message: 'Report status updated successfully'
      };
    } catch (error) {
      console.error('Error updating report status:', error);
      return {
        success: false,
        message: 'Failed to update report status',
        error: 'UPDATE_REPORT_ERROR'
      };
    }
  }

  /**
   * Get user's reports (reports made by the user)
   */
  async getUserReports(
    userId: string,
    pagination: PaginationOptions = {}
  ): Promise<{
    reports: ReportWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { reportedById: userId },
        include: {
          reportedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          reportedUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.report.count({ where: { reportedById: userId } })
    ]);

    return {
      reports: reports as ReportWithDetails[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get report statistics (Admin only)
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    postReports: number;
    userReports: number;
  }> {
    const [
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      postReports,
      userReports
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWED' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
      prisma.report.count({ where: { postId: { not: null } } }),
      prisma.report.count({ where: { postId: null } })
    ]);

    return {
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      postReports,
      userReports
    };
  }
}

export const reportService = new ReportService();