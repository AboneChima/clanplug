// API base URL - always use environment variable or fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clanplug-dji6xa91a-oracles-projects-0d30db20.vercel.app';

// Shared response wrapper matching backend
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  avatar?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  isKYCVerified?: boolean;
  kycStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginData {
  user: PublicUser;
  tokens: TokenPair;
}

export interface RefreshData {
  tokens: TokenPair;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
      ...options,
    };

    let response: Response;
    try {
      // Add 30 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      const reason = err?.message || 'Network error';
      throw new Error(`Failed to reach API at ${url}: ${reason}. Check server is running and NEXT_PUBLIC_API_URL.`);
    }

    // Try to parse JSON; if not JSON, fall back to text
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }
    } catch {
      // Non-JSON body or empty
      data = {};
    }

    if (!response.ok) {
      const message = (data && (data.message || data.error)) || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginData>> {
    return this.request<ApiResponse<LoginData>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginData>> {
    return this.request<ApiResponse<LoginData>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshData>> {
    return this.request<ApiResponse<RefreshData>>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(accessToken: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getProfile(accessToken: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/users/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async updateProfile(accessToken: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/users/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  // Wallet endpoints
  async getWalletStatus(accessToken: string): Promise<ApiResponse<{ connected: boolean; provider?: string; address?: string }>> {
    return this.request<ApiResponse<{ connected: boolean; provider?: string; address?: string }>>('/api/wallets/status', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async connectWallet(accessToken: string, provider: string = 'metamask'): Promise<ApiResponse<{ provider: string; address: string }>> {
    return this.request<ApiResponse<{ provider: string; address: string }>>('/api/wallets/connect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ provider }),
    });
  }

  async disconnectWallet(accessToken: string): Promise<ApiResponse<{}>> {
    return this.request<ApiResponse<{}>>('/api/wallets/disconnect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async getWalletBalance(accessToken: string): Promise<ApiResponse<Record<string, number>>> {
    return this.request<ApiResponse<Record<string, number>>>('/api/wallets/balance', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async getWalletTransactions(accessToken: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/api/wallets/transactions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async transferToUser(accessToken: string, payload: { 
    recipient: string; 
    amount: number; 
    currency: string; 
    description?: string 
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/wallets/transfer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  // Posts endpoints
  async listPosts(query?: string): Promise<ApiResponse<any[]>> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<ApiResponse<any[]>>(`/api/posts${q}`, {
      method: 'GET',
    });
  }

  async createPost(accessToken: string, payload: { title: string; content: string }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  async getPost(postId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/posts/${postId}`, { method: 'GET' });
  }

  async updatePost(accessToken: string, postId: string, payload: { title?: string; content?: string }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  async deletePost(accessToken: string, postId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // Chat endpoints
  async listChats(accessToken: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/api/chats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async createChat(accessToken: string, payload: { title?: string; participants?: string[] }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/chats', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  async getChatMessages(accessToken: string, chatId: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/api/chats/${chatId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async sendChatMessage(accessToken: string, chatId: string, payload: { content: string }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  }

  // Generic HTTP methods for services
  async get<T = any>(endpoint: string, options: { headers?: Record<string, string>; params?: Record<string, any> } = {}): Promise<ApiResponse<T>> {
    const { headers = {}, params = {} } = options;
    const queryString = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<ApiResponse<T>>(`${endpoint}${queryString}`, {
      method: 'GET',
      headers,
    });
  }

  async post<T = any>(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}): Promise<ApiResponse<T>> {
    const { headers = {} } = options;
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}): Promise<ApiResponse<T>> {
    const { headers = {} } = options;
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options: { headers?: Record<string, string> } = {}): Promise<ApiResponse<T>> {
    const { headers = {} } = options;
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}): Promise<ApiResponse<T>> {
    const { headers = {} } = options;
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();