// Centralize Express.Request augmentation in auth.middleware.ts to avoid conflicts.

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User types
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  status: string;
  role: string;
  kycStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
}

// Wallet types
export interface WalletBalance {
  currency: string;
  balance: number;
  lockedBalance: number;
}

export interface DepositRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface WithdrawRequest {
  amount: number;
  currency: string;
  bankAccount: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

export interface TransferRequest {
  recipientId: string;
  amount: number;
  currency: string;
  description?: string;
}

// Post types
export interface CreatePostRequest {
  title: string;
  content: string;
  type: string;
  category?: string;
  price?: number;
  currency?: string;
  images?: string[];
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  price?: number;
  currency?: string;
  images?: string[];
  tags?: string[];
}

// Chat types
export interface CreateChatRequest {
  participantIds: string[];
  type: string;
  name?: string;
}

export interface SendMessageRequest {
  content: string;
  type: string;
  replyToId?: string;
  attachments?: string[];
}

// VTU types
export interface AirtimePurchaseRequest {
  network: string;
  phoneNumber: string;
  amount: number;
}

export interface DataPurchaseRequest {
  network: string;
  phoneNumber: string;
  planId: string;
}

export interface CableTVPurchaseRequest {
  provider: string;
  decoderNumber: string;
  planId: string;
}

export interface ElectricityPurchaseRequest {
  provider: string;
  meterNumber: string;
  amount: number;
  meterType: string;
}

// Escrow types
export interface CreateEscrowRequest {
  sellerId: string;
  postId?: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  deliveryDays: number;
}

// KYC types
export interface KYCSubmissionRequest {
  documentType: string;
  documentNumber: string;
  documentImages: string[];
  selfieImage: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

// Notification types
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  transactionAlerts: boolean;
  chatMessages: boolean;
  postUpdates: boolean;
}

// File upload types
export interface FileUploadResponse {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

// Error types
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  details?: any;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search types
export interface SearchQuery extends PaginationQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  location?: string;
}

export default {};