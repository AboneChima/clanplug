import { Request, Response, NextFunction } from 'express';
import { jwtUtils, tokenBlacklist } from '../utils/auth';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isKYCVerified: boolean;
        status: string;
        verificationBadge?: {
          status: string;
          expiresAt: Date | null;
        } | null;
      };
    }
  }
}

// Type for authenticated requests - use intersection type for better compatibility
export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: UserRole;
    isKYCVerified: boolean;
    status: string;
    verificationBadge?: {
      status: string;
      expiresAt: Date | null;
    } | null;
  };
};

// Extract token from request headers
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    // Verify token
    let payload;
    try {
      payload = jwtUtils.verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid token',
        code: 'TOKEN_INVALID'
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isKYCVerified: true,
        isEmailVerified: true,
        lockedUntil: true,
        verificationBadge: {
          select: {
            status: true,
            expiresAt: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Check if user account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(423).json({
        success: false,
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        data: {
          lockedUntil: user.lockedUntil
        }
      });
      return;
    }

    // Check user status
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Account has been suspended',
        code: 'ACCOUNT_SUSPENDED'
      });
      return;
    }

    if (user.status === 'BANNED') {
      res.status(403).json({
        success: false,
        message: 'Account has been banned',
        code: 'ACCOUNT_BANNED'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isKYCVerified: user.isKYCVerified,
      status: user.status,
      verificationBadge: user.verificationBadge
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      next();
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      next();
      return;
    }

    // Verify token
    let payload;
    try {
      payload = jwtUtils.verifyAccessToken(token);
    } catch (error) {
      next();
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isKYCVerified: true,
        isEmailVerified: true,
        lockedUntil: true,
        verificationBadge: {
          select: {
            status: true,
            expiresAt: true
          }
        }
      }
    });

    if (user && user.status === 'ACTIVE' && (!user.lockedUntil || user.lockedUntil <= new Date())) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isKYCVerified: user.isKYCVerified,
        status: user.status,
        verificationBadge: user.verificationBadge
      };
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        data: {
          required: roles,
          current: req.user.role
        }
      });
      return;
    }

    next();
  };
};

// KYC verification middleware
export const requireKYC = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.isKYCVerified) {
    res.status(403).json({
      success: false,
      message: 'KYC verification required',
      code: 'KYC_REQUIRED'
    });
    return;
  }

  next();
};

// Email verification middleware
export const requireEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isEmailVerified: true }
    });

    if (!user?.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required',
        code: 'EMAIL_VERIFICATION_REQUIRED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Admin only middleware
export const adminOnly = authorize(UserRole.ADMIN);

// User or Admin middleware
export const userOrAdmin = authorize(UserRole.USER, UserRole.ADMIN);

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireKYC,
  requireEmailVerification,
  adminOnly,
  userOrAdmin
};