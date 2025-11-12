import { Request, Response } from 'express';
import { escrowMessageService } from '../services/escrowMessage.service';

class EscrowMessageController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;
      const { message, attachments } = req.body;
      const senderId = req.user!.id;

      const result = await escrowMessageService.createMessage({
        escrowId,
        senderId,
        message,
        attachments
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        const statusCode = result.error === 'ESCROW_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Send escrow message error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await escrowMessageService.getMessages(escrowId, userId, page, limit);

      res.json({
        success: true,
        message: 'Messages retrieved successfully',
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get escrow messages error:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('not authorized') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve messages',
        error: statusCode === 404 ? 'ESCROW_NOT_FOUND' : 
               statusCode === 403 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR'
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;
      const userId = req.user!.id;

      const count = await escrowMessageService.getUnreadCount(escrowId, userId);

      res.json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;
      const userId = req.user!.id;

      const result = await escrowMessageService.markMessagesAsRead(escrowId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error === 'ESCROW_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
}

export const escrowMessageController = new EscrowMessageController();