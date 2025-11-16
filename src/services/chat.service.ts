import { authApi } from '@/lib/auth-api';

export interface ChatParticipant {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  lastReadAt?: string;
  isActive: boolean;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT';
  name?: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  participants?: ChatParticipant[];
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string;
  attachments: string[];
  metadata?: any;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  replyTo?: ChatMessage;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface CreateChatRequest {
  type?: 'DIRECT' | 'GROUP' | 'SUPPORT';
  name?: string;
  description?: string;
  participants?: string[];
}

export interface SendMessageRequest {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  attachments?: string[];
  replyToId?: string;
  metadata?: any;
}

export interface FileUploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    size: number;
    type: string;
  };
  message?: string;
}

export class ChatService {
  private static instance: ChatService;
  private eventSource: EventSource | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Chat Management
  async getChats(accessToken?: string): Promise<Chat[]> {
    try {
      console.log('🔍 Fetching chats from API...');
      const response = await authApi.get('/api/chats');
      console.log('📥 Chat API response:', response);
      console.log('📥 Response.data:', response.data);
      
      if (response.data) {
        if (response.data.success) {
          const chatsData = response.data.data || response.data.chats || [];
          console.log('✅ Extracted chats data:', chatsData);
          return Array.isArray(chatsData) ? chatsData : [];
        } else {
          console.error('⚠️ API returned success: false', response.data.message);
          return [];
        }
      }
      console.error('⚠️ No data in response');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      return [];
    }
  }

  async createChat(accessToken: string, data: CreateChatRequest): Promise<Chat> {
    const response = await authApi.post('/api/chats', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create chat');
  }

  async getChatDetails(accessToken: string, chatId: string): Promise<Chat> {
    const response = await authApi.get(`/api/chats/${chatId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch chat details');
  }

  // Message Management
  async getMessages(chatId: string, accessToken?: string): Promise<ChatMessage[]> {
    try {
      console.log('🔍 Fetching messages for chat:', chatId);
      // Add timestamp to prevent caching
      const response = await authApi.get(`/api/chats/${chatId}/messages?_t=${Date.now()}`);
      console.log('📥 Full response object:', response);
      console.log('📥 Response.data:', response.data);
      
      // authApi.get returns the axios response, so data is in response.data
      const responseData = response.data;
      console.log('📥 Parsed responseData:', responseData);
      
      if (responseData && responseData.success) {
        const messagesData = responseData.data || responseData.messages || [];
        console.log('✅ Parsed messages:', messagesData.length, 'messages');
        console.log('✅ Messages array:', messagesData);
        return Array.isArray(messagesData) ? messagesData : [];
      }
      console.log('⚠️ Response not successful:', responseData);
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching messages:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  }

  async sendMessage(chatId: string, data: SendMessageRequest, accessToken?: string): Promise<ChatMessage> {
    try {
      const response = await authApi.post(`/api/chats/${chatId}/messages`, data);
      
      // Backend returns {success: true, data: message} OR just the message directly
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // If response.data has message properties, it's the message itself
      if (response.data.id && response.data.chatId) {
        return response.data;
      }
      
      throw new Error(response.data.message || 'Failed to send message');
    } catch (error: any) {
      console.error('Send message error:', error);
      
      // Check if it's a network error
      if (!error.response) {
        throw new Error('Network error: Unable to reach server');
      }
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send message';
      throw new Error(errorMessage);
    }
  }

  async editMessage(accessToken: string, chatId: string, messageId: string, content: string): Promise<ChatMessage> {
    const response = await authApi.put(`/api/chats/${chatId}/messages/${messageId}`, { content });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to edit message');
  }

  async deleteMessage(accessToken: string, chatId: string, messageId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete message');
    }
  }

  // File Upload
  async uploadFile(accessToken: string, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = await response.json();
    return data;
  }

  // Real-time Communication
  connectRealtime(accessToken: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/chats/stream?token=${accessToken}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.connectionHandlers.forEach(handler => handler(true));
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.connectionHandlers.forEach(handler => handler(false));
    };
  }

  disconnectRealtime(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionHandlers.forEach(handler => handler(false));
    }
  }

  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  // Utility Functions
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎥';
      case 'mp3':
      case 'wav':
      case 'ogg': return '🎵';
      case 'zip':
      case 'rar':
      case '7z': return '📦';
      default: return '📎';
    }
  }

  static isImageFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  }
}

export const chatService = ChatService.getInstance();