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
  replyTo?: {
    id: string;
    content: string;
    sender?: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
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
      console.log('📥 Chat API full response:', response);
      
      // authApi returns the response directly, not wrapped in .data
      if (response.success) {
        const chatsData = response.data || [];
        console.log('✅ Extracted chats data:', chatsData);
        return Array.isArray(chatsData) ? chatsData : [];
      } else {
        console.error('⚠️ API returned success: false', response.message);
        return [];
      }
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
      console.log('📥 Messages API response:', response);
      
      // authApi returns unwrapped response directly
      if (response.success) {
        const messagesData = response.data || [];
        console.log('✅ Loaded messages:', messagesData.length, 'messages');
        return Array.isArray(messagesData) ? messagesData : [];
      } else {
        console.error('⚠️ API returned success: false', response.message);
        return [];
      }
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

  // File Upload - Use backend upload endpoint
  async uploadFile(accessToken: string, file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('postType', 'CHAT'); // Mark as chat upload

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data?.urls && data.data.urls.length > 0) {
        return {
          success: true,
          data: {
            url: data.data.urls[0],
            filename: file.name,
            size: file.size,
            type: file.type
          }
        };
      }
      return { success: false, message: data.message || 'Upload failed' };
    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false, message: error.message || 'Network error - unable to reach server' };
    }
  }

  // Real-time Communication
  connectRealtime(accessToken: string): void {
    if (this.eventSource) {
      console.log('🔌 Closing existing EventSource connection');
      this.eventSource.close();
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/chats/stream?token=${accessToken}`;
    console.log('🔌 Creating new EventSource connection to:', url);
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('✅ EventSource connection opened successfully');
      this.connectionHandlers.forEach(handler => handler(true));
    };

    this.eventSource.onmessage = (event) => {
      try {
        console.log('📥 Raw SSE event data:', event.data);
        const message = JSON.parse(event.data);
        console.log('📨 Parsed SSE message:', message);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('❌ Failed to parse SSE message:', error, 'Raw data:', event.data);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ EventSource error:', error);
      console.log('EventSource readyState:', this.eventSource?.readyState);
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