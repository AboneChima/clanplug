const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: 'GROUP';
  isActive: boolean;
  memberCount: number;
  isJoined: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  color: string;
  joinedAt: string;
  verificationBadge?: {
    status: string;
  };
}

export interface GroupMessage {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  attachments?: string[];
  userId: string;
  chatId: string;
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
}

export const groupService = {
  // Get all available groups
  async getGroups(token: string): Promise<Group[]> {
    console.log('🌐 Fetching groups from:', `${API_URL}/api/groups`);
    console.log('🔑 Using token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
    
    const response = await fetch(`${API_URL}/api/groups`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 Groups API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groups API error:', response.status, errorText);
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Groups API result:', result);
    return result.data || result;
  },

  // Join a group
  async joinGroup(chatId: string, token: string): Promise<{ success: boolean; message: string; color?: string }> {
    const response = await fetch(`${API_URL}/api/groups/${chatId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join group');
    }
    
    return response.json();
  },

  // Leave a group
  async leaveGroup(chatId: string, token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/groups/${chatId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to leave group');
    }
    
    return response.json();
  },

  // Get group details
  async getGroupDetails(chatId: string, token: string): Promise<Group & { members: GroupMember[] }> {
    const response = await fetch(`${API_URL}/api/groups/${chatId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch group details');
    }
    
    const result = await response.json();
    return result.data || result;
  },

  // Get group messages (from user's join date)
  async getGroupMessages(chatId: string, token: string, page: number = 1): Promise<GroupMessage[]> {
    const response = await fetch(`${API_URL}/api/groups/${chatId}/messages?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch group messages');
    }
    
    const result = await response.json();
    return result.data || result;
  },

  // Send a message (uses existing chat endpoint)
  async sendMessage(chatId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT', attachments?: string[], token?: string): Promise<GroupMessage> {
    const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, type, attachments }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }
    
    return response.json();
  },
};
