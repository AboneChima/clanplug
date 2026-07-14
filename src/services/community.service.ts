import { authApi } from '@/lib/auth-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  // Get all communities for discovery
  async getDiscoverCommunities(): Promise<Community[]> {
    try {
      const response = await authApi.get('/api/communities/discover');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch discover communities:', error);
      return [];
    }
  },

  // Get user's joined communities
  async getMyCommunities(): Promise<Community[]> {
    try {
      const response = await authApi.get('/api/communities/my-communities');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch my communities:', error);
      return [];
    }
  },

  // Get community details
  async getCommunityDetails(communityId: string): Promise<Community & { members: CommunityMember[] }> {
    const response = await authApi.get(`/api/communities/${communityId}`);
    return response.data;
  },

  // Join a community
  async joinCommunity(communityId: string): Promise<{ success: boolean; color: string }> {
    const response = await authApi.post(`/api/communities/${communityId}/join`);
    return response;
  },

  // Leave a community
  async leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    const response = await authApi.post(`/api/communities/${communityId}/leave`);
    return response;
  },

  // Get community messages
  async getMessages(communityId: string, page: number = 1): Promise<CommunityMessage[]> {
    const response = await authApi.get(`/api/communities/${communityId}/messages?page=${page}`);
    return response.data || [];
  },

  // Send a message
  async sendMessage(
    communityId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    attachments?: string[],
    replyToId?: string
  ): Promise<CommunityMessage> {
    const response = await authApi.post(`/api/communities/${communityId}/messages`, {
      content,
      type,
      attachments,
      replyToId,
    });
    return response.data;
  },

  // Mark community as read
  async markAsRead(communityId: string): Promise<void> {
    await authApi.put(`/api/communities/${communityId}/read`);
  },
};
