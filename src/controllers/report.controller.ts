import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReportController {
  /**
   * Report a post
   */
  async reportPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Reason is required',
          error: 'MISSING_REASON'
        });
        return;
      }

      if (reason.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Reason must be 100 characters or less',
          error: 'REASON_TOO_LONG'
        });
        return;
      }

      if (description && description.length > 500) {
        res.status(400).json({
          success: false,
          message: 'Description must be 500 characters or less',
          error: 'DESCRIPTION_TOO_LONG'
        });
        return;
      }

      const result = await reportService.reportPost(postId, userId, {
        reason: reason.trim(),
        description: description?.trim()
      });

      if (!result.success) {
        const statusCode = result.error === 'POST_NOT_FOUND' ? 404 :
                          result.error === 'CANNOT_REPORT_OWN_POST' ? 403 :
                          result.error === 'ALREADY_REPORTED' ? 409 : 400;
        
        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in reportPost:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Report a user
   */
  async reportUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId: reportedUserId } = req.params;
      const { reason, description } = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Reason is required',
          error: 'MISSING_REASON'
        });
        return;
      }

      if (reason.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Reason must be 100 characters or less',
          error: 'REASON_TOO_LONG'
        });
        return;
      }

      if (description && description.length > 500) {
        res.status(400).json({
          success: false,
          message: 'Description must be 500 characters or less',
          error: 'DESCRIPTION_TOO_LONG'
        });
        return;
      }

      const result = await reportService.reportUser(reportedUserId, userId, {
        reason: reason.trim(),
        description: description?.trim()
      });

      if (!result.success) {
        const statusCode = result.error === 'USER_NOT_FOUND' ? 404 :
                          result.error === 'CANNOT_REPORT_SELF' ? 403 :
                          result.error === 'ALREADY_REPORTED' ? 409 : 400;
        
        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in reportUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get all reports (Admin only)
   */
  async getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if user is admin (you should implement proper admin check)
      // For now, we'll assume any authenticated user can access this
      // In production, add proper role-based access control

      const {
        status,
        reason,
        reportedUserId,
        postId,
        startDate,
        endDate,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number',
          error: 'INVALID_PAGE'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)',
          error: 'INVALID_LIMIT'
        });
        return;
      }

      // Validate sort parameters
      const validSortBy = ['createdAt', 'updatedAt', 'status'];
      const validSortOrder = ['asc', 'desc'];

      if (!validSortBy.includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortBy parameter',
          error: 'INVALID_SORT_BY'
        });
        return;
      }

      if (!validSortOrder.includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortOrder parameter',
          error: 'INVALID_SORT_ORDER'
        });
        return;
      }

      // Parse dates if provided
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate) {
        parsedStartDate = new Date(startDate as string);
        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid start date format',
            error: 'INVALID_START_DATE'
          });
          return;
        }
      }

      if (endDate) {
        parsedEndDate = new Date(endDate as string);
        if (isNaN(parsedEndDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid end date format',
            error: 'INVALID_END_DATE'
          });
          return;
        }
      }

      const result = await reportService.getReports(
        {
          status: status as string,
          reason: reason as string,
          reportedUserId: reportedUserId as string,
          postId: postId as string,
          startDate: parsedStartDate,
          endDate: parsedEndDate
        },
        {
          page: pageNum,
          limit: limitNum,
          sortBy: sortBy as 'createdAt' | 'updatedAt' | 'status',
          sortOrder: sortOrder as 'asc' | 'desc'
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get report by ID (Admin only)
   */
  async getReportById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;

      const report = await reportService.getReportById(reportId);

      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found',
          error: 'REPORT_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error in getReportById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Update report status (Admin only)
   */
  async updateReportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;

      // Validate required fields
      if (!status || status.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Status is required',
          error: 'MISSING_STATUS'
        });
        return;
      }

      if (adminNotes && adminNotes.length > 1000) {
        res.status(400).json({
          success: false,
          message: 'Admin notes must be 1000 characters or less',
          error: 'ADMIN_NOTES_TOO_LONG'
        });
        return;
      }

      const result = await reportService.updateReportStatus(
        reportId,
        status.trim(),
        adminNotes?.trim()
      );

      if (!result.success) {
        const statusCode = result.error === 'REPORT_NOT_FOUND' ? 404 :
                          result.error === 'INVALID_STATUS' ? 400 : 500;
        
        res.status(statusCode).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateReportStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get user's reports
   */
  async getUserReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number',
          error: 'INVALID_PAGE'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)',
          error: 'INVALID_LIMIT'
        });
        return;
      }

      const result = await reportService.getUserReports(userId, {
        page: pageNum,
        limit: limitNum,
        sortBy: sortBy as 'createdAt' | 'updatedAt' | 'status',
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getUserReports:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get report statistics (Admin only)
   */
  async getReportStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await reportService.getReportStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getReportStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
}

export const reportController = new ReportController();