import { prisma } from '../config/database';
import { ChatType } from '@prisma/client';

// User color palette (WhatsApp-like)
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal  
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B195', // Peach
  '#C06C84', // Rose
  '#6C5B7B', // Plum
  '#355C7D', // Navy
  '#2ECC71', // Green
];

// Generate consistent color for user in a chat
const getUserColor = (userId: string, chatId: string): string => {
  const combined = `${userId}-${chatId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

export const groupService = {
  // Get all available groups
  async getAvailableGroups(userId: string) {
    try {
      const groups = await prisma.chat.findMany({
        where: {
          type: ChatType.GROUP,
          isActive: true,
        },
        include: {
          participants: {
            where: { isActive: true },
            select: { userId: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return groups.map(group => ({
        ...group,
        memberCount: group.participants.length,
        isJoined: group.participants.some(p => p.userId === userId),
        lastMessage: group.messages[0] || null,
      }));
    } catch (error) {
      console.error('Error getting groups:', error);
      throw error;
    }
  },

  // Join a group
  async joinGroup(userId: string, chatId: string) {
    try {
      // Check if group exists
      const chat = await prisma.chat.findFirst({
        where: { id: chatId, type: ChatType.GROUP, isActive: true },
      });

      if (!chat) {
        throw new Error('Group not found');
      }

      // Check if already a participant
      const existing = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: { chatId, userId },
        },
      });

      if (existing) {
        if (!existing.isActive) {
          // Reactivate if previously left
          await prisma.chatParticipant.update({
            where: { id: existing.id },
            data: { isActive: true, joinedAt: new Date() },
          });
        }
        return { success: true, message: 'Already a member', participant: existing };
      }

      // Add as new participant
      const color = getUserColor(userId, chatId);
      const participant = await prisma.chatParticipant.create({
        data: {
          chatId,
          userId,
          role: 'member',
          isActive: true,
          joinedAt: new Date(),
        },
      });

      // Store color in metadata
      await prisma.chatParticipant.update({
        where: { id: participant.id },
        data: {
          // We'll store color in a separate table or use JSON field if available
        },
      });

      return { success: true, message: 'Joined group successfully', participant, color };
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  },

  // Leave a group
  async leaveGroup(userId: string, chatId: string) {
    try {
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: { chatId, userId },
        },
      });

      if (!participant) {
        throw new Error('Not a member of this group');
      }

      await prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { isActive: false },
      });

      return { success: true, message: 'Left group successfully' };
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  },

  // Get group details with members
  async getGroupDetails(chatId: string, userId: string) {
    try {
      const chat = await prisma.chat.findFirst({
        where: { id: chatId, type: ChatType.GROUP, isActive: true },
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
                  verificationBadge: {
                    select: { status: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!chat) {
        throw new Error('Group not found');
      }

      // Check if user is a member
      const isMember = chat.participants.some(p => p.userId === userId);
      if (!isMember) {
        throw new Error('Not a member of this group');
      }

      // Add colors to members
      const membersWithColors = chat.participants.map(p => ({
        ...p.user,
        color: getUserColor(p.userId, chatId),
        joinedAt: p.joinedAt,
      }));

      return {
        ...chat,
        members: membersWithColors,
        memberCount: chat.participants.length,
      };
    } catch (error) {
      console.error('Error getting group details:', error);
      throw error;
    }
  },

  // Get user color for a chat
  getUserChatColor(userId: string, chatId: string): string {
    return getUserColor(userId, chatId);
  },

  // Get messages from user's join date
  async getGroupMessages(chatId: string, userId: string, page: number = 1, limit: number = 20) {
    try {
      // Get user's join date
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: { chatId, userId },
        },
      });

      if (!participant || !participant.isActive) {
        throw new Error('Not a member of this group');
      }

      const skip = (page - 1) * limit;

      const messages = await prisma.chatMessage.findMany({
        where: {
          chatId,
          createdAt: { gte: participant.joinedAt }, // Only messages from join date
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
              verificationBadge: {
                select: { status: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Add colors to messages
      const messagesWithColors = messages.map(msg => ({
        ...msg,
        userColor: getUserColor(msg.userId, chatId),
      }));

      return messagesWithColors.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting group messages:', error);
      throw error;
    }
  },
};
