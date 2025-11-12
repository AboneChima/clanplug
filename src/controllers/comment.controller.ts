import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const commentController = {
  // POST /api/posts/:postId/comments - Create a new comment
  async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user!.id;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Comment content is required',
          error: 'INVALID_CONTENT',
        });
        return;
      }

      if (content.length > 1000) {
        res.status(400).json({
          success: false,
          message: 'Comment content cannot exceed 1000 characters',
          error: 'CONTENT_TOO_LONG',
        });
        return;
      }

      const result = await commentService.createComment(postId, userId, {
        content: content.trim(),
        parentId,
      });

      if (!result.success) {
        const statusCode = result.error === 'POST_NOT_FOUND' || result.error === 'PARENT_COMMENT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.comment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: error.message,
      });
    }
  },

  // GET /api/posts/:postId/comments - Get comments for a post
  async getPostComments(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      const userId = (req as AuthenticatedRequest).user?.id;

      const result = await commentService.getPostComments(
        postId,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: error.message,
      });
    }
  },

  // GET /api/comments/:commentId/replies - Get replies for a comment
  async getCommentReplies(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { page = '1', limit = '10' } = req.query;
      const userId = (req as AuthenticatedRequest).user?.id;

      const result = await commentService.getCommentReplies(
        commentId,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.replies,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comment replies',
        error: error.message,
      });
    }
  },

  // GET /api/comments/:commentId - Get comment by ID
  async getCommentById(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.id;

      const result = await commentService.getCommentById(commentId, userId);

      if (!result.success) {
        const statusCode = result.error === 'COMMENT_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: result.comment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comment',
        error: error.message,
      });
    }
  },

  // PUT /api/comments/:commentId - Update comment
  async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Comment content is required',
          error: 'INVALID_CONTENT',
        });
        return;
      }

      if (content.length > 1000) {
        res.status(400).json({
          success: false,
          message: 'Comment content cannot exceed 1000 characters',
          error: 'CONTENT_TOO_LONG',
        });
        return;
      }

      const result = await commentService.updateComment(commentId, userId, {
        content: content.trim(),
      });

      if (!result.success) {
        const statusCode = result.error === 'COMMENT_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        data: result.comment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error.message,
      });
    }
  },

  // DELETE /api/comments/:commentId - Delete comment
  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      const result = await commentService.deleteComment(commentId, userId);

      if (!result.success) {
        const statusCode = result.error === 'COMMENT_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
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
        message: 'Failed to delete comment',
        error: error.message,
      });
    }
  },

  // GET /api/users/:userId/comments - Get user's comments
  async getUserComments(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await commentService.getUserComments(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user comments',
        error: error.message,
      });
    }
  },
};

export default commentController;