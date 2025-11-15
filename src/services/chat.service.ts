import { PrismaClient, ChatType, MessageType } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface CreateChatRequest {
  type?: ChatType;
  name?: string;
  description?: string;
  participants: string[];
  creatorId: string;
}

export interface SendMessageRequest {
  chatId: string;
  userId: string;
  content: string;
  type?: MessageType;
  attachments?: string[];
  replyToId?: string;
}

export interface UpdateMessageRequest {
  messageId: string;
  userId: string;
  content: string;
}

export interface ChatWithDetails {
  id: string;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatar: string | null;
  isActive: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    userId: string;
    role: string;
    joinedAt: Date;
    lastReadAt: Date | null;
    isActive: boolean;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }[];
  messages?: {
    id: string;
    type: MessageType;
    content: string;
    attachments: string[];
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }[];
  unreadCount?: number;
}

export interface MessageWithDetails {
  id: string;
  chatId: string;
  userId: string;
  type: MessageType;
  content: string;
  attachments: string[];
  metadata?: any;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    user: {
      username: string;
    };
  };
}

export interface PaginatedMessages {
  messages: MessageWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ChatService {
  // Get user's chats
  async getUserChats(userId: string, page = 1, limit = 20): Promise<ChatWithDetails[]> {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const participant = chat.participants.find(p => p.userId === userId);
        const unreadCount = await prisma.chatMessage.count({
          where: {
            chatId: chat.id,
            userId: { not: userId },
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
            isDeleted: false,
          },
        });

        return {
          ...chat,
          unreadCount,
        };
      })
    );

    return chatsWithUnread;
  }

  // Create new chat
  async createChat(request: CreateChatRequest): Promise<ChatWithDetails> {
    const { type = ChatType.DIRECT, name, description, participants, creatorId } = request;

    // Ensure creator is in participants
    const allParticipants = Array.from(new Set([creatorId, ...participants]));

    // For direct chats, ensure only 2 participants
    if (type === ChatType.DIRECT && allParticipants.length !== 2) {
      throw new Error('Direct chats must have exactly 2 participants');
    }

    // Check if direct chat already exists
    if (type === ChatType.DIRECT) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: ChatType.DIRECT,
          participants: {
            every: {
              userId: { in: allParticipants },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (existingChat && existingChat.participants.length === 2) {
        return existingChat as ChatWithDetails;
      }
    }

    const chat = await prisma.chat.create({
      data: {
        type,
        name,
        description,
        participants: {
          create: allParticipants.map((userId, index) => ({
            userId,
            role: userId === creatorId ? 'owner' : 'member',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return chat as ChatWithDetails;
  }

  // Get chat by ID
  async getChatById(chatId: string, userId: string): Promise<ChatWithDetails | null> {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
        isActive: true,
      },
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return chat as ChatWithDetails | null;
  }

  // Get chat messages
  async getChatMessages(
    chatId: string,
    userId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedMessages> {
    // Verify user is participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this chat');
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: {
          chatId,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatMessage.count({
        where: {
          chatId,
          isDeleted: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      messages: messages.reverse() as MessageWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Send message
  async sendMessage(request: SendMessageRequest): Promise<MessageWithDetails> {
    const { chatId, userId, content, type = MessageType.TEXT, attachments = [], replyToId } = request;

    // Verify user is participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this chat');
    }

    // Verify reply message exists if replyToId is provided
    if (replyToId) {
      const replyMessage = await prisma.chatMessage.findFirst({
        where: {
          id: replyToId,
          chatId,
          isDeleted: false,
        },
      });

      if (!replyMessage) {
        throw new Error('Reply message not found');
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        userId,
        type,
        content,
        attachments,
        replyToId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    // Update chat's lastMessageAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: message.createdAt },
    });

    // Send notifications to other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: { not: userId },
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    for (const participant of otherParticipants) {
      await notificationService.createNotification({
        userId: participant.userId,
        type: 'CHAT',
        title: 'New Message',
        message: `${message.user.username}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        data: {
          chatId,
          messageId: message.id,
          senderId: userId,
        },
      });
    }

    return message as MessageWithDetails;
  }

  // Update message
  async updateMessage(request: UpdateMessageRequest): Promise<MessageWithDetails> {
    const { messageId, userId, content } = request;

    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        userId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new Error('Message not found or you do not have permission to edit it');
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    return updatedMessage as MessageWithDetails;
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        userId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new Error('Message not found or you do not have permission to delete it');
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message has been deleted',
        updatedAt: new Date(),
      },
    });
  }

  // Add participant to chat
  async addParticipant(chatId: string, userId: string, newParticipantId: string): Promise<void> {
    // Verify user is admin/owner of the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        role: { in: ['admin', 'owner'] },
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('You do not have permission to add participants to this chat');
    }

    // Check if chat is direct (can't add participants to direct chats)
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (chat?.type === ChatType.DIRECT) {
      throw new Error('Cannot add participants to direct chats');
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: newParticipantId,
      },
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        throw new Error('User is already a participant in this chat');
      } else {
        // Reactivate participant
        await prisma.chatParticipant.update({
          where: { id: existingParticipant.id },
          data: { isActive: true, joinedAt: new Date() },
        });
      }
    } else {
      // Add new participant
      await prisma.chatParticipant.create({
        data: {
          chatId,
          userId: newParticipantId,
          role: 'member',
        },
      });
    }

    // Send notification to new participant
    await notificationService.createNotification({
      userId: newParticipantId,
      type: 'CHAT',
      title: 'Added to Chat',
      message: `You have been added to ${chat?.name || 'a chat'}`,
      data: {
        chatId,
        addedBy: userId,
      },
    });
  }

  // Remove participant from chat
  async removeParticipant(chatId: string, userId: string, participantId: string): Promise<void> {
    // Verify user is admin/owner of the chat or removing themselves
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('You are not a participant in this chat');
    }

    // Check permissions
    if (userId !== participantId && !['admin', 'owner'].includes(participant.role)) {
      throw new Error('You do not have permission to remove participants from this chat');
    }

    // Check if chat is direct (can't remove participants from direct chats)
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (chat?.type === ChatType.DIRECT) {
      throw new Error('Cannot remove participants from direct chats');
    }

    // Remove participant
    await prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId: participantId,
      },
      data: { isActive: false },
    });
  }

  // Mark chat as read
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this chat');
    }

    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
  }

  // Get unread message count for a chat
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      return 0;
    }

    return await prisma.chatMessage.count({
      where: {
        chatId,
        userId: { not: userId },
        createdAt: {
          gt: participant.lastReadAt || new Date(0),
        },
        isDeleted: false,
      },
    });
  }
}

export const chatService = new ChatService();