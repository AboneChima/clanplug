import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { redisUtils } from '../config/redis';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Password utilities
export const passwordUtils = {
  // Hash password
  async hash(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  },

  // Verify password
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Failed to verify password');
    }
  },

  // Generate random password
  generate(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
};

// JWT utilities
export const jwtUtils = {
  // Generate access token
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: config.APP_NAME,
        audience: config.APP_URL,
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error('Failed to generate access token');
    }
  },

  // Generate refresh token
  generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        issuer: config.APP_NAME,
        audience: config.APP_URL,
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error('Failed to generate refresh token');
    }
  },

  // Generate token pair
  generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  },

  // Verify access token
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: config.APP_NAME,
        audience: config.APP_URL,
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Failed to verify access token');
    }
  },

  // Verify refresh token
  verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: config.APP_NAME,
        audience: config.APP_URL,
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Failed to verify refresh token');
    }
  },

  // Decode token without verification (for debugging)
  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  },

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};

// Token blacklist utilities (using Redis)
export const tokenBlacklist = {
  // Add token to blacklist
  async add(token: string, expirationTime?: Date): Promise<void> {
    try {
      const expiration = expirationTime || jwtUtils.getTokenExpiration(token);
      if (expiration) {
        const ttl = Math.floor((expiration.getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          await redisUtils.set(`blacklist:${token}`, 'true', ttl);
        }
      }
    } catch (error) {
      console.error('Failed to add token to blacklist:', error);
    }
  },

  // Check if token is blacklisted
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await redisUtils.get(`blacklist:${token}`);
      return result === 'true';
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  },

  // Remove token from blacklist
  async remove(token: string): Promise<void> {
    try {
      await redisUtils.del(`blacklist:${token}`);
    } catch (error) {
      console.error('Failed to remove token from blacklist:', error);
    }
  }
};

// Session utilities (using Redis)
export const sessionUtils = {
  // Store user session
  async store(userId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    try {
      await redisUtils.set(
        `session:${userId}`,
        JSON.stringify(sessionData),
        ttlSeconds
      );
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  },

  // Get user session
  async get(userId: string): Promise<any | null> {
    try {
      const sessionData = await redisUtils.get(`session:${userId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  },

  // Update session
  async update(userId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    try {
      const existingSession = await this.get(userId);
      const updatedSession = { ...existingSession, ...sessionData };
      await this.store(userId, updatedSession, ttlSeconds);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  },

  // Delete session
  async delete(userId: string): Promise<void> {
    try {
      await redisUtils.del(`session:${userId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },

  // Check if session exists
  async exists(userId: string): Promise<boolean> {
    try {
      return await redisUtils.exists(`session:${userId}`);
    } catch (error) {
      console.error('Failed to check session existence:', error);
      return false;
    }
  }
};

// Generate random codes
export const codeUtils = {
  // Generate OTP
  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
  },

  // Generate referral code
  generateReferralCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Generate transaction reference
  generateTransactionRef(prefix: string = 'TXN'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
};

// Rate limiting utilities
export const rateLimitUtils = {
  // Check rate limit
  async checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    try {
      const current = await redisUtils.incr(key);
      
      if (current === 1) {
        await redisUtils.expire(key, windowSeconds);
      }
      
      const remaining = Math.max(0, maxAttempts - current);
      const resetTime = new Date(Date.now() + (windowSeconds * 1000));
      
      return {
        allowed: current <= maxAttempts,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      // Allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: maxAttempts,
        resetTime: new Date(Date.now() + (windowSeconds * 1000))
      };
    }
  },

  // Reset rate limit
  async resetRateLimit(key: string): Promise<void> {
    try {
      await redisUtils.del(key);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }
};

export default {
  passwordUtils,
  jwtUtils,
  tokenBlacklist,
  sessionUtils,
  codeUtils,
  rateLimitUtils
};