import { apiClient, ApiResponse } from './api';

/**
 * Authenticated API client that automatically includes tokens from localStorage
 * This provides a convenient wrapper around the base API client for authenticated requests
 */
class AuthenticatedApiClient {
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available. Please log in.');
    }
    
    try {
      return await requestFn(token);
    } catch (error: any) {
      // If we get a 401, unauthorized, or invalid token error, the token might be expired
      if (error.message?.includes('401') || 
          error.message?.includes('Unauthorized') || 
          error.message?.includes('Invalid access token') ||
          error.message?.includes('Access token required')) {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            console.log('Attempting token refresh...');
            const refreshResponse = await apiClient.refresh(refreshToken);
            
            if (refreshResponse.success && refreshResponse.data && refreshResponse.data.tokens) {
              console.log('Token refresh successful');
              // Update stored tokens
              localStorage.setItem('accessToken', refreshResponse.data.tokens.accessToken);
              localStorage.setItem('refreshToken', refreshResponse.data.tokens.refreshToken);
              
              // Retry the original request with new token
              return await requestFn(refreshResponse.data.tokens.accessToken);
            } else {
              console.error('Token refresh failed: Invalid response structure', refreshResponse);
              // Clear tokens and throw error
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              throw new Error('Session expired. Please log in again.');
            }
          } catch (refreshError: any) {
            console.error('Token refresh error:', refreshError.message || refreshError);
            // Refresh failed, clear tokens and throw original error
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          console.error('No refresh token available');
          // No refresh token available
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please log in again.');
        }
      }
      throw error;
    }
  }

  // User Profile
  async getProfile() {
    return this.makeAuthenticatedRequest(token => apiClient.getProfile(token));
  }

  async updateProfile(payload: any) {
    return this.makeAuthenticatedRequest(token => apiClient.updateProfile(token, payload));
  }

  // Wallet operations
  async getWalletStatus() {
    return this.makeAuthenticatedRequest(token => apiClient.getWalletStatus(token));
  }

  async connectWallet(provider: string = 'metamask') {
    return this.makeAuthenticatedRequest(token => apiClient.connectWallet(token, provider));
  }

  async disconnectWallet() {
    return this.makeAuthenticatedRequest(token => apiClient.disconnectWallet(token));
  }

  async getWalletBalance() {
    return this.makeAuthenticatedRequest(token => apiClient.getWalletBalance(token));
  }

  async getWalletTransactions() {
    return this.makeAuthenticatedRequest(token => apiClient.getWalletTransactions(token));
  }

  // Posts
  async createPost(payload: { title: string; content: string }) {
    return this.makeAuthenticatedRequest(token => apiClient.createPost(token, payload));
  }

  async updatePost(postId: string, payload: { title?: string; content?: string }) {
    return this.makeAuthenticatedRequest(token => apiClient.updatePost(token, postId, payload));
  }

  async deletePost(postId: string) {
    return this.makeAuthenticatedRequest(token => apiClient.deletePost(token, postId));
  }

  // Chats
  async listChats() {
    return this.makeAuthenticatedRequest(token => apiClient.listChats(token));
  }

  async createChat(payload: { title?: string; participants?: string[] }) {
    return this.makeAuthenticatedRequest(token => apiClient.createChat(token, payload));
  }

  async getChatMessages(chatId: string) {
    return this.makeAuthenticatedRequest(token => apiClient.getChatMessages(token, chatId));
  }

  async sendChatMessage(chatId: string, payload: { content: string }) {
    return this.makeAuthenticatedRequest(token => apiClient.sendChatMessage(token, chatId, payload));
  }

  // Generic authenticated requests
  async get<T = any>(endpoint: string, params?: Record<string, any>) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.get<T>(endpoint, { 
        headers: { Authorization: `Bearer ${token}` },
        params 
      })
    );
  }

  async post<T = any>(endpoint: string, data?: any) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post<T>(endpoint, data, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async put<T = any>(endpoint: string, data?: any) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.put<T>(endpoint, data, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async delete<T = any>(endpoint: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.delete<T>(endpoint, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async patch<T = any>(endpoint: string, data?: any) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.patch<T>(endpoint, data, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  // Payment operations
  async initiateDeposit(payload: { amount: number; currency: string; gateway: string; description?: string }) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/payments/deposit/initiate', payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }



  async getBanks() {
    return this.makeAuthenticatedRequest(token => 
      apiClient.get('/api/payments/banks', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async verifyPayment(reference: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/payments/verify', { reference }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  // Wallet address operations
  async getWalletAddresses() {
    return this.makeAuthenticatedRequest(token => 
      apiClient.get('/api/wallets/addresses', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async generateWalletAddresses() {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/wallets/addresses/generate', {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async updateWalletAddresses(usdtAddress?: string, ngnAddress?: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.put('/api/wallets/addresses', { usdtAddress, ngnAddress }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  // Crypto payment methods
  async getCryptoCurrencies() {
    try {
      // This endpoint doesn't require authentication
      return await apiClient.get('/api/crypto/currencies');
    } catch (error) {
      console.error('Error fetching crypto currencies:', error);
      throw error;
    }
  }

  async getCryptoMinimumAmount(currency: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.get(`/api/crypto/minimum-amount/${currency}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async getCryptoEstimate(amount: number, currencyFrom: string, currencyTo: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/crypto/estimate', { 
        amount, 
        currency_from: currencyFrom, 
        currency_to: currencyTo 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async initiateCryptoDeposit(amount: number, currency: string, payCurrency: string, description?: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/crypto/deposit/initiate', { 
        amount, 
        currency, 
        payCurrency, 
        description 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async getCryptoPaymentStatus(paymentId: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.get(`/api/crypto/payment/${paymentId}/status`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async verifyCryptoPayment(paymentId: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post(`/api/crypto/verify/${paymentId}`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  // Transfer methods
  async addTestBalance(amount: number, currency: string = 'NGN') {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/test/add-balance', { 
        amount, 
        currency 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  async transferToUser(recipient: string, amount: number, currency: string, description?: string) {
    return this.makeAuthenticatedRequest(token => 
      apiClient.post('/api/wallets/transfer', { 
        recipient, 
        amount, 
        currency, 
        description 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    );
  }

  // Logout
  async logout() {
    return this.makeAuthenticatedRequest(token => apiClient.logout(token));
  }
}

export const authApi = new AuthenticatedApiClient();