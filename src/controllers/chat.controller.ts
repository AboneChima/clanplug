import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { MessageType, ChatType } from '@prisma/client';
import multer = require('multer');
import * as path from 'path';
import * as fs from 'fs';

// Store SSE connections
const sseConnections = new Map<string, Response>();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and other common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Helper to broadcast message to user's SSE connections
function broadcastToUser(userId: string, message: any) {
  const connection = sseConnections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to user:', userId, error);
      sseConnections.delete(userId);
    }
  }
}

class ChatController {
  // GET /api/chats - Get user chats
  async getUserChats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const chats = await chatService.getUserChats(userId, page, limit);

      return res.json({
        success: true,
        data: chats,
      });
    } catch (error) {
      console.error('Get user chats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve chats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/chats/direct/:userId - Get or create direct chat with a user
  async getOrCreateDirectChat(req: Request, res: Response): Promise<Response> {
    try {
      const currentUserId = (req as any).user.id;
      const { userId } = req.params;

      if (currentUserId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create chat with yourself',
        });
      }

      const chat = await chatService.getOrCreateDirectChat(currentUserId, userId);

      return res.json({
        success: true,
        data: chat,
      });
    } catch (error) {
      console.error('Get or create direct chat error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get or create direct chat',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/chats - Create new chat
  async createChat(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { type, name, description, participants } = req.body;

      // Validate participants array
      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Participants array is required and must contain at least one user ID',
        });
      }

      const chat = await chatService.createChat({
        type: type || ChatType.DIRECT,
        name,
        description,
        participants,
        creatorId: userId,
      });

      return res.status(201).json({
        success: true,
        data: chat,
        message: 'Chat created successfully',
      });
    } catch (error) {
      console.error('Create chat error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create chat',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/chats/:chatId - Get chat details
  async getChatById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;

      const chat = await chatService.getChatById(chatId, userId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found',
        });
      }

      return res.json({
        success: true,
        data: chat,
      });
    } catch (error) {
      console.error('Get chat by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/chats/:chatId/messages - Get chat messages
  async getChatMessages(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await chatService.getChatMessages(chatId, userId, page, limit);

      return res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get chat messages error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to retrieve messages',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/chats/:chatId/messages - Send message
  async sendMessage(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;
      const { content, type, attachments, replyToId, metadata } = req.body;

      const message = await chatService.sendMessage({
        chatId,
        userId,
        content,
        type: type || MessageType.TEXT,
        attachments: attachments || [],
        replyToId,
        metadata,
      });

      // Broadcast message to all chat participants via Socket.IO
      try {
        const { emitToChat } = require('../socket/socket');
        emitToChat(chatId, 'message:new', message);
      } catch (error) {
        console.warn('Socket.IO not available, message not broadcasted:', error);
      }

      // Also broadcast via SSE for backward compatibility
      const chat = await chatService.getChatById(chatId, userId);
      if (chat && chat.participants) {
        chat.participants.forEach((participant: any) => {
          if (participant.userId !== userId) {
            broadcastToUser(participant.userId, message);
          }
        });
      }

      return res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /api/chats/:chatId/messages/:messageId - Update message
  async updateMessage(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { messageId } = req.params;
      const { content } = req.body;

      const message = await chatService.updateMessage({
        messageId,
        userId,
        content,
      });

      return res.json({
        success: true,
        data: message,
        message: 'Message updated successfully',
      });
    } catch (error) {
      console.error('Update message error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/chats/:chatId/messages/:messageId - Delete message
  async deleteMessage(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { messageId } = req.params;

      await chatService.deleteMessage(messageId, userId);

      return res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Delete message error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to delete message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/chats/:chatId/participants - Add participant to chat
  async addParticipant(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;
      const { userId: newParticipantId } = req.body;

      if (!newParticipantId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      await chatService.addParticipant(chatId, userId, newParticipantId);

      return res.json({
        success: true,
        message: 'Participant added successfully',
      });
    } catch (error) {
      console.error('Add participant error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to add participant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /api/chats/:chatId/participants/:userId - Remove participant from chat
  async removeParticipant(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId, userId: participantId } = req.params;

      await chatService.removeParticipant(chatId, userId, participantId);

      return res.json({
        success: true,
        message: 'Participant removed successfully',
      });
    } catch (error) {
      console.error('Remove participant error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to remove participant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /api/chats/:chatId/read - Mark chat as read
  async markChatAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;

      await chatService.markChatAsRead(chatId, userId);

      return res.json({
        success: true,
        message: 'Chat marked as read',
      });
    } catch (error) {
      console.error('Mark chat as read error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to mark chat as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /api/chats/:chatId/unread-count - Get unread message count
  async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;
      const { chatId } = req.params;

      const count = await chatService.getUnreadCount(chatId, userId);

      return res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/chats/:chatId/upload - Upload file to chat
  async uploadFile(req: Request, res: Response): Promise<Response> {
    return new Promise((resolve, reject) => {
      try {
        const userId = (req as any).user.id;
        const { chatId } = req.params;

        // Use multer middleware
        upload.single('file')(req, res, async (err) => {
          if (err) {
            const response = res.status(400).json({
              success: false,
              message: 'File upload failed',
              error: err.message,
            });
            resolve(response);
            return;
          }

          if (!req.file) {
            const response = res.status(400).json({
              success: false,
              message: 'No file uploaded',
            });
            resolve(response);
            return;
          }

          try {
            // Create file URL
            const fileUrl = `/uploads/chat/${req.file.filename}`;
            
            // Determine message type based on file type
            const messageType: MessageType = req.file.mimetype.startsWith('image/') 
              ? MessageType.IMAGE 
              : MessageType.FILE;

            // Send message with file attachment
            const message = await chatService.sendMessage({
              chatId,
              userId,
              content: req.file.originalname,
              type: messageType,
              attachments: [fileUrl],
            });

            const response = res.status(201).json({
              success: true,
              data: {
                message,
                file: {
                  originalName: req.file.originalname,
                  filename: req.file.filename,
                  size: req.file.size,
                  mimetype: req.file.mimetype,
                  url: fileUrl,
                },
              },
              message: 'File uploaded and message sent successfully',
            });
            resolve(response);
          } catch (error) {
            // Delete uploaded file if message creation fails
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            
            console.error('Upload file error:', error);
            const response = res.status(500).json({
              success: false,
              message: 'Failed to process file upload',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            resolve(response);
          }
        });
      } catch (error) {
        console.error('Upload file error:', error);
        const response = res.status(500).json({
          success: false,
          message: 'Failed to upload file',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        resolve(response);
      }
    });
  }

  // GET /api/chats/stream - SSE endpoint for real-time messages
  async streamMessages(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Store connection
    sseConnections.set(userId, res);
    console.log(`[SSE] User ${userId} connected to chat stream`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', userId, time: new Date().toISOString() })}\n\n`);

    // Send keepalive ping every 30 seconds
    const keepAlive = setInterval(() => {
      try {
        res.write(`:keepalive\n\n`);
      } catch (error) {
        clearInterval(keepAlive);
        sseConnections.delete(userId);
      }
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      sseConnections.delete(userId);
      console.log(`[SSE] User ${userId} disconnected from chat stream`);
      res.end();
    });
  }
}

export const chatController = new ChatController();
export { sseConnections, broadcastToUser };
