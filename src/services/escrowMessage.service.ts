import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateEscrowMessageRequest {
  escrowId: string;
  senderId: string;
  message: string;
  attachments?: string[];
}

export interface EscrowMessageResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface EscrowMessagesListResponse {
  messages: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class EscrowMessageService {
  async createMessage(request: CreateEscrowMessageRequest): Promise<EscrowMessageResponse> {
    try {
      // Verify escrow exists and user is participant
      const escrow = await prisma.escrow.findUnique({
        where: { id: request.escrowId },
        include: {
          buyer: { select: { id: true, username: true } },
          seller: { select: { id: true, username: true } }
        }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      // Check if sender is either buyer or seller
      if (escrow.buyerId !== request.senderId && escrow.sellerId !== request.senderId) {
        return {
          success: false,
          message: 'You are not authorized to send messages in this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      // Create the message
      const escrowMessage = await prisma.escrowMessage.create({
        data: {
          escrowId: request.escrowId,
          senderId: request.senderId,
          message: request.message,
          attachments: request.attachments || []
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Create notification for the other party
      const recipientId = escrow.buyerId === request.senderId ? escrow.sellerId : escrow.buyerId;
      const senderName = escrowMessage.sender.firstName + ' ' + escrowMessage.sender.lastName;
      
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'ESCROW',
          title: 'New Escrow Message',
          message: `${senderName} sent you a message in escrow "${escrow.title}"`,
          data: {
            escrowId: request.escrowId,
            messageId: escrowMessage.id,
            senderId: request.senderId
          }
        }
      });

      return {
        success: true,
        message: 'Message sent successfully',
        data: escrowMessage
      };
    } catch (error) {
      console.error('Create escrow message error:', error);
      return {
        success: false,
        message: 'Failed to send message',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async getMessages(
    escrowId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<EscrowMessagesListResponse> {
    try {
      // Verify escrow exists and user is participant
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Check if user is either buyer or seller
      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        throw new Error('You are not authorized to view messages in this escrow');
      }

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.escrowMessage.findMany({
          where: { escrowId },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.escrowMessage.count({
          where: { escrowId }
        })
      ]);

      // Mark messages as read for the current user
      await prisma.escrowMessage.updateMany({
        where: {
          escrowId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get escrow messages error:', error);
      throw error;
    }
  }

  async getUnreadCount(escrowId: string, userId: string): Promise<number> {
    try {
      // Verify escrow exists and user is participant
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return 0;
      }

      // Check if user is either buyer or seller
      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        return 0;
      }

      return await prisma.escrowMessage.count({
        where: {
          escrowId,
          senderId: { not: userId },
          isRead: false
        }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  async markMessagesAsRead(escrowId: string, userId: string): Promise<EscrowMessageResponse> {
    try {
      // Verify escrow exists and user is participant
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      // Check if user is either buyer or seller
      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        return {
          success: false,
          message: 'You are not authorized to access this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      await prisma.escrowMessage.updateMany({
        where: {
          escrowId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Messages marked as read'
      };
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return {
        success: false,
        message: 'Failed to mark messages as read',
        error: 'INTERNAL_ERROR'
      };
    }
  }
}

export const escrowMessageService = new EscrowMessageService();