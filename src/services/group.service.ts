// Group Service for Frontend
import { apiClient } from '@/lib/api';

export interface Group {
  id: string;
  type: string;
  name: string;
  description: string | null;
  avatar: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessage?: string | null;
  members: GroupMember[];
  unreadCount?: number;
  isMember?: boolean; // Whether current user is a member
}

export interface GroupMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  avatar?: string;
  memberIds: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
}

class GroupService {
  // Create new group
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await apiClient.post('/api/groups', data);
    return response.data.data;
  }

  // Get user's groups
  async getUserGroups(page = 1, limit = 20): Promise<Group[]> {
    try {
      // Add cache-busting parameter to force fresh data
      const cacheBuster = Date.now();
      const response = await apiClient.get('/api/groups', {
        params: { page, limit, _t: cacheBuster },
      });
      // Return the data array, or empty array if undefined
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error('Error fetching user groups:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  // Get group by ID
  async getGroupById(groupId: string): Promise<Group> {
    try {
      const response = await apiClient.get(`/api/groups/${groupId}`);
      // Handle both response.data.data and response.data structures
      const groupData = response.data?.data || response.data;
      if (!groupData || !groupData.id) {
        throw new Error('Group not found or invalid response');
      }
      return groupData;
    } catch (error: any) {
      console.error('Error fetching group by ID:', error);
      throw error;
    }
  }

  // Update group info
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const response = await apiClient.put(`/api/groups/${groupId}`, data);
    return response.data.data;
  }

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/api/groups/${groupId}`);
  }

  // Add members to group
  async addMembers(groupId: string, memberIds: string[]): Promise<void> {
    await apiClient.post(`/api/groups/${groupId}/members`, { memberIds });
  }

  // Remove member from group
  async removeMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/api/groups/${groupId}/members/${memberId}`);
  }

  // Update member role
  async updateMemberRole(
    groupId: string,
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<void> {
    await apiClient.put(`/api/groups/${groupId}/members/${memberId}/role`, { role });
  }

  // Get group members
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    console.log('🔍 Fetching group members for groupId:', groupId);
    try {
      const response = await apiClient.get(`/api/groups/${groupId}/members`);
      console.log('📦 Group members response:', response.data);
      
      const members = response.data.data || response.data || [];
      console.log('✅ Parsed members:', members);
      
      return members;
    } catch (error: any) {
      console.error('❌ getGroupMembers error:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  // Leave group (remove self)
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await this.removeMember(groupId, userId);
  }

  // Join group (self-join)
  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/api/groups/${groupId}/join`);
  }
}

export const groupService = new GroupService();
