import { prisma } from '../config/database';
import { ChatType } from '@prisma/client';

// User color palette for communities (13 colors)
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

// Generate consistent color for user in a community
function getUserColor(userId: string, communityId: string): string {
  const combined = `${userId}-${communityId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  image?: string;
  banner?: string;
  game?: string;
  memberCount: number;
  isJoined: boolean;
  userColor?: string;
  lastMessage?: {
    senderName: string;
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  color: string;
  role: string;
  joinedAt: string;
  isOnline?: boolean;
  verificationBadge?: {
    status: string;
  };
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  attachments?: string[];
  userId: string;
  userColor: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    verificationBadge?: {
      status: string;
    };
  };
  replyTo?: {
    id: string;
    content: string;
    user: {
      username: string;
    };
  };
}

export const communityService = {
  // Get all available communities for discovery
  async getDiscoverCommunities(userId: string): Promise<Community[]> {
    const communities = await prisma.chat.findMany({
      where: {
        type: ChatType.GROUP,
        isActive: true,
      },
      include: {
        participants: {
          where: { isActive: true },
          select: { userId: true, joinedAt: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return communities.map(community => {
      const isJoined = community.participants.some(p => p.userId === userId);
      const lastMsg = community.messages[0];
      
      return {
        id: community.id,
        name: community.name || 'Community',
        description: community.description || undefined,
        image: community.avatar || undefined,
        banner: undefined,
        game: community.name || undefined,
        memberCount: community.participants.length,
        isJoined,
        userColor: isJoined ? getUserColor(userId, community.id) : undefined,
        lastMessage: lastMsg ? {
          senderName: lastMsg.user.firstName || lastMsg.user.username,
          content: lastMsg.content,
          createdAt: lastMsg.createdAt.toISOString(),
        } : undefined,
        createdAt: community.createdAt.toISOString(),
      };
    });
  },

  // Get user's joined communities
  async getMyCommunitiesAsync(userId: string): Promise<Community[]> {
    const communities = await prisma.chat.findMany({
      where: {
        type: ChatType.GROUP,
        isActive: true,
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
          where: { isActive: true },
          select: { userId: true, lastReadAt: true, joinedAt: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return Promise.all(communities.map(async (community) => {
      const participant = community.participants.find(p => p.userId === userId);
      const lastMsg = community.messages[0];
      
      // Count unread messages
      const unreadCount = participant?.lastReadAt
        ? await prisma.chatMessage.count({
            where: {
              chatId: community.id,
              createdAt: { gt: participant.lastReadAt },
              userId: { not: userId },
              isDeleted: false,
            },
          })
        : await prisma.chatMessage.count({
            where: {
              chatId: community.id,
              createdAt: { gte: participant?.joinedAt || new Date(0) },
              userId: { not: userId },
              isDeleted: false,
            },
          });

      return {
        id: community.id,
        name: community.name || 'Community',
        description: community.description || undefined,
        image: community.avatar || undefined,
        banner: undefined,
        game: community.name || undefined,
        memberCount: community.participants.length,
        isJoined: true,
        userColor: getUserColor(userId, community.id),
        lastMessage: lastMsg ? {
          senderName: lastMsg.user.firstName || lastMsg.user.username,
          content: lastMsg.content,
          createdAt: lastMsg.createdAt.toISOString(),
        } : undefined,
        unreadCount,
        createdAt: community.createdAt.toISOString(),
      };
    }));
  },

  // Get community details
  async getCommunityDetails(communityId: string, userId: string): Promise<Community & { members: CommunityMember[] }> {
    const community = await prisma.chat.findFirst({
      where: { id: communityId, type: ChatType.GROUP, isActive: true },
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    const isJoined = community.participants.some(p => p.userId === userId);
    const lastMsg = community.messages[0];

    const members = community.participants.map(p => ({
      id: p.user.id,
      username: p.user.username,
      firstName: p.user.firstName || undefined,
      lastName: p.user.lastName || undefined,
      avatar: p.user.avatar || undefined,
      color: getUserColor(p.userId, communityId),
      role: p.role,
      joinedAt: p.joinedAt.toISOString(),
      verificationBadge: p.user.verificationBadge || undefined,
    }));

    return {
      id: community.id,
      name: community.name || 'Community',
      description: community.description || undefined,
      image: community.avatar || undefined,
      banner: undefined,
      game: community.name || undefined,
      memberCount: community.participants.length,
      isJoined,
      userColor: isJoined ? getUserColor(userId, communityId) : undefined,
      lastMessage: lastMsg ? {
        senderName: lastMsg.user.firstName || lastMsg.user.username,
        content: lastMsg.content,
        createdAt: lastMsg.createdAt.toISOString(),
      } : undefined,
      createdAt: community.createdAt.toISOString(),
      members,
    };
  },

  // Join community
  async joinCommunity(userId: string, communityId: string): Promise<{ success: boolean; color: string }> {
    const community = await prisma.chat.findFirst({
      where: { id: communityId, type: ChatType.GROUP, isActive: true },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    // Check if already a member
    const existing = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: communityId, userId },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate membership
        await prisma.chatParticipant.update({
          where: { id: existing.id },
          data: { isActive: true, joinedAt: new Date() },
        });
      }
      return { success: true, color: getUserColor(userId, communityId) };
    }

    // Add as new member
    await prisma.chatParticipant.create({
      data: {
        chatId: communityId,
        userId,
        role: 'member',
        isActive: true,
        joinedAt: new Date(),
      },
    });

    return { success: true, color: getUserColor(userId, communityId) };
  },

  // Leave community
  async leaveCommunity(userId: string, communityId: string): Promise<{ success: boolean }> {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: communityId, userId },
      },
    });

    if (!participant) {
      throw new Error('Not a member of this community');
    }

    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { isActive: false },
    });

    return { success: true };
  },

  // Get community messages
  async getCommunityMessages(communityId: string, userId: string, page: number = 1, limit: number = 50): Promise<CommunityMessage[]> {
    // Verify membership
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: communityId, userId },
      },
    });

    if (!participant || !participant.isActive) {
      throw new Error('Not a member of this community');
    }

    const skip = (page - 1) * limit;

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: communityId,
        createdAt: { gte: participant.joinedAt },
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
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return messages.reverse().map(msg => ({
      id: msg.id,
      communityId: msg.chatId,
      content: msg.content,
      type: msg.type as 'TEXT' | 'IMAGE' | 'SYSTEM',
      attachments: msg.attachments,
      userId: msg.userId,
      userColor: getUserColor(msg.userId, communityId),
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        username: msg.user.username,
        firstName: msg.user.firstName || undefined,
        lastName: msg.user.lastName || undefined,
        avatar: msg.user.avatar || undefined,
        verificationBadge: msg.user.verificationBadge || undefined,
      },
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
        user: {
          username: msg.replyTo.user.username,
        },
      } : undefined,
    }));
  },

  // Send community message
  async sendCommunityMessage(
    communityId: string,
    userId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    attachments?: string[],
    replyToId?: string
  ): Promise<CommunityMessage> {
    // Verify membership
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: communityId, userId },
      },
    });

    if (!participant || !participant.isActive) {
      throw new Error('Not a member of this community');
    }

    const message = await prisma.chatMessage.create({
      data: {
        chatId: communityId,
        userId,
        type,
        content,
        attachments: attachments || [],
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
            verificationBadge: {
              select: { status: true },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    // Update chat's lastMessageAt
    await prisma.chat.update({
      where: { id: communityId },
      data: { lastMessageAt: message.createdAt },
    });

    return {
      id: message.id,
      communityId: message.chatId,
      content: message.content,
      type: message.type as 'TEXT' | 'IMAGE' | 'SYSTEM',
      attachments: message.attachments,
      userId: message.userId,
      userColor: getUserColor(message.userId, communityId),
      createdAt: message.createdAt.toISOString(),
      user: {
        id: message.user.id,
        username: message.user.username,
        firstName: message.user.firstName || undefined,
        lastName: message.user.lastName || undefined,
        avatar: message.user.avatar || undefined,
        verificationBadge: message.user.verificationBadge || undefined,
      },
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        user: {
          username: message.replyTo.user.username,
        },
      } : undefined,
    };
  },

  // Mark community as read
  async markCommunityAsRead(communityId: string, userId: string): Promise<void> {
    await prisma.chatParticipant.updateMany({
      where: {
        chatId: communityId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  },
};
