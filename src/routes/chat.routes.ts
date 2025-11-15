import { Router, Request, Response } from 'express';
import { authenticate, requireKYC, optionalAuthenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { chatController } from '../controllers/chat.controller';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Helper function to generate message IDs
const makeMsgId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: any): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

// GET /api/chats - Get user chats
router.get('/', 
  authenticate, 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.getUserChats.bind(chatController))
);

// POST /api/chats - Create new chat (NO KYC REQUIRED - Everyone can chat)
router.post('/', 
  authenticate, 
  [
    body('type').optional().isIn(['DIRECT', 'GROUP', 'SUPPORT']).withMessage('Invalid chat type'),
    body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('participants').optional().isArray().withMessage('Participants must be an array'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.createChat.bind(chatController))
);

// GET /api/chats/:chatId - Get chat details
router.get('/:chatId', 
  authenticate, 
  param('chatId').notEmpty().withMessage('Chat ID is required'),
  handleValidationErrors,
  asyncHandler(chatController.getChatById.bind(chatController))
);

// GET /api/chats/:chatId/messages - Get chat messages
router.get('/:chatId/messages', 
  authenticate, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.getChatMessages.bind(chatController))
);

// POST /api/chats/:chatId/messages - Send message (NO KYC REQUIRED - Everyone can send messages)
router.post('/:chatId/messages', 
  authenticate, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
    body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).withMessage('Invalid message type'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
    body('replyToId').optional().isString().withMessage('Reply to ID must be a string'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.sendMessage.bind(chatController))
);

// PUT /api/chats/:chatId/messages/:messageId - Update message
router.put('/:chatId/messages/:messageId', 
  authenticate, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    param('messageId').notEmpty().withMessage('Message ID is required'),
    body('content').isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.updateMessage.bind(chatController))
);

// DELETE /api/chats/:chatId/messages/:messageId - Delete message
router.delete('/:chatId/messages/:messageId', 
  authenticate, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    param('messageId').notEmpty().withMessage('Message ID is required'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.deleteMessage.bind(chatController))
);

// POST /api/chats/:chatId/participants - Add participant to chat
router.post('/:chatId/participants', 
  authenticate, 
  requireKYC, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.addParticipant.bind(chatController))
);

// DELETE /api/chats/:chatId/participants/:userId - Remove participant from chat
router.delete('/:chatId/participants/:userId', 
  authenticate, 
  [
    param('chatId').notEmpty().withMessage('Chat ID is required'),
    param('userId').notEmpty().withMessage('User ID is required'),
  ],
  handleValidationErrors,
  asyncHandler(chatController.removeParticipant.bind(chatController))
);

// PUT /api/chats/:chatId/read - Mark chat as read
router.put('/:chatId/read', 
  authenticate, 
  param('chatId').notEmpty().withMessage('Chat ID is required'),
  handleValidationErrors,
  asyncHandler(chatController.markChatAsRead.bind(chatController))
);

// GET /api/chats/:chatId/unread-count - Get unread message count
router.get('/:chatId/unread-count', 
  authenticate, 
  param('chatId').notEmpty().withMessage('Chat ID is required'),
  handleValidationErrors,
  asyncHandler(chatController.getUnreadCount.bind(chatController))
);

// POST /api/chats/:chatId/upload - Upload file to chat
router.post('/:chatId/upload', 
  authenticate, 
  requireKYC, 
  param('chatId').notEmpty().withMessage('Chat ID is required'),
  handleValidationErrors,
  asyncHandler(chatController.uploadFile.bind(chatController))
);

export default router;

// Simple Server-Sent Events stream for real-time demo
router.get('/stream', optionalAuthenticate, asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = (req as any).user?.id || 'anonymous';
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('hello', { message: 'connected', userId, time: new Date().toISOString() });

  const interval = setInterval(() => {
    sendEvent('message', {
      id: makeMsgId(),
      chatId: 'stream',
      senderId: 'system',
      content: `ping ${new Date().toLocaleTimeString()}`,
      createdAt: new Date().toISOString(),
    });
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}));