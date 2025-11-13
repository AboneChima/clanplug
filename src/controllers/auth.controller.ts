import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { Currency, UserStatus } from '@prisma/client';
import { passwordUtils, jwtUtils, tokenBlacklist, sessionUtils, codeUtils, rateLimitUtils } from '../utils/auth';
import { emailService } from '../services/email.service';
import config from '../config/config';

// Helper to pick public user fields
function toPublicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    emailVerified: user.isEmailVerified,
    phoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response) {
  const { email, password, username, firstName, lastName, fullName, phone, referredBy } = req.body || {};

  if (!email || !password || !username) {
    return res.status(400).json({ success: false, message: 'Email, username and password are required', code: 'VALIDATION_ERROR' });
  }

  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or username already exists', code: 'CONFLICT' });
    }

    const hashedPassword = await passwordUtils.hash(password);
    const referralCode = codeUtils.generateReferralCode(8);
    const verificationToken = codeUtils.generateOTP(32);

    let fName = firstName;
    let lName = lastName;
    if ((!fName || !lName) && fullName) {
      const parts = String(fullName).trim().split(/\s+/);
      fName = fName || parts[0] || 'User';
      lName = lName || parts.slice(1).join(' ') || 'Account';
    }
    if (!fName || !lName) {
      return res.status(400).json({ success: false, message: 'firstName and lastName are required', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName: fName,
        lastName: lName,
        phone: phone || undefined,
        referralCode,
        referredBy: referredBy || undefined,
        passwordHash: hashedPassword,
        status: UserStatus.PENDING_VERIFICATION,
        verificationToken,
      },
    });

    // Create default wallets for supported currencies (best-effort)
    try {
      const currencies = (process.env.SUPPORTED_CURRENCIES || 'NGN,USD').split(',');
      for (const cur of currencies) {
        const c = cur.trim().toUpperCase();
        if (c === 'NGN' || c === 'USD') {
          await prisma.wallet.create({ data: { userId: user.id, currency: c as Currency } });
        }
      }
    } catch (e) {
      console.warn('Failed to create default wallets:', e);
    }

    // If referredBy matches a referrer, increment referral count (best-effort)
    if (referredBy) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: referredBy } });
      if (referrer) {
        await prisma.user.update({ where: { id: referrer.id }, data: { totalReferrals: (referrer.totalReferrals || 0) + 1 } });
      }
    }

    // Send verification email (best-effort) - skip if email not configured
    if (config.SMTP_HOST && config.SMTP_USER) {
      try {
        await Promise.race([
          emailService.sendVerificationEmail(user.email, {
            username: user.firstName || user.username,
            verificationCode: verificationToken,
            verificationUrl: `${config.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 3000))
        ]);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    }

    const tokens = jwtUtils.generateTokenPair({ userId: user.id, email: user.email, role: user.role });
    await sessionUtils.store(user.id, { ip: req.ip, ua: req.headers['user-agent'] }, 86400);

    return res.status(201).json({ success: true, message: 'Registration successful', data: { user: toPublicUser(user), tokens } });
  } catch (error: any) {
    console.error('Registration error:', error);
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email or username already exists', code: 'CONFLICT' });
    }
    return res.status(500).json({ success: false, message: 'Failed to register', code: 'SERVER_ERROR' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, username, password } = req.body || {};
  if ((!email && !username) || !password) {
    return res.status(400).json({ success: false, message: 'Email or username and password are required', code: 'VALIDATION_ERROR' });
  }

  try {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: email || undefined }, { username: username || undefined }] } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await passwordUtils.verify(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ success: false, message: 'Account banned', code: 'ACCOUNT_BANNED' });
    }

    const tokens = jwtUtils.generateTokenPair({ userId: user.id, email: user.email, role: user.role });
    await sessionUtils.store(user.id, { ip: req.ip, ua: req.headers['user-agent'] }, 86400);

    return res.status(200).json({ success: true, message: 'Login successful', data: { user: toPublicUser(user), tokens } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Failed to login', code: 'SERVER_ERROR' });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required', code: 'VALIDATION_ERROR' });
  }

  try {
    const payload = jwtUtils.verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
    }

    const tokens = jwtUtils.generateTokenPair({ userId: user.id, email: user.email, role: user.role });
    return res.status(200).json({ success: true, message: 'Token refreshed', data: { tokens } });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      try {
        // Try to get token expiration and add to blacklist
        const exp = jwtUtils.getTokenExpiration(token);
        await tokenBlacklist.add(token, exp || undefined);
        
        // Try to get user ID from token for session cleanup
        const payload = jwtUtils.verifyAccessToken(token);
        if (payload?.userId) {
          await sessionUtils.delete(payload.userId);
        }
      } catch (tokenError) {
        // Token is invalid, but that's okay for logout
        console.log('Logout with invalid token (this is normal):', tokenError instanceof Error ? tokenError.message : 'Unknown error');
      }
    }

    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout', code: 'SERVER_ERROR' });
  }
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password, adminKey } = req.body || {};
  
  if (!email || !password || !adminKey) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, password, and admin key are required', 
      code: 'VALIDATION_ERROR' 
    });
  }

  try {
    // Verify admin key
    if (adminKey !== config.ADMIN_ACCESS_KEY) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin access key', 
        code: 'INVALID_ADMIN_KEY' 
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials', 
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Verify password
    const valid = await passwordUtils.verify(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials', 
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.', 
        code: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    // Check account status
    if (user.status === 'BANNED') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account banned', 
        code: 'ACCOUNT_BANNED' 
      });
    }

    // Generate tokens
    const tokens = jwtUtils.generateTokenPair({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    // Store session
    await sessionUtils.store(user.id, { 
      ip: req.ip, 
      ua: req.headers['user-agent'] 
    }, 86400);

    return res.status(200).json({ 
      success: true, 
      message: 'Admin login successful', 
      data: { 
        user: toPublicUser(user), 
        tokens 
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to login', 
      code: 'SERVER_ERROR' 
    });
  }
}

// Forgot Password
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Check rate limit
    const rateLimitKey = `forgot_password:${email}`;
    const isRateLimited = await rateLimitUtils.checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000); // 3 attempts per 15 minutes
    
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset attempts. Please try again later.',
        code: 'RATE_LIMITED'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = codeUtils.generateOTP(32);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, {
      username: user.firstName || user.username,
      resetCode: resetToken,
      resetUrl: `${config.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
    });

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      code: 'SERVER_ERROR'
    });
  }
}

// Reset Password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Hash new password
    const hashedPassword = await passwordUtils.hash(newPassword);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      code: 'SERVER_ERROR'
    });
  }
}

// Verify Email
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        code: 'MISSING_TOKEN'
      });
    }

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
        code: 'INVALID_TOKEN'
      });
    }

    if (user.status === UserStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Update user status and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        verificationToken: null,
        emailVerifiedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      code: 'SERVER_ERROR'
    });
  }
}

// Resend Verification Email
export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Check rate limit
    const rateLimitKey = `resend_verification:${email}`;
    const isRateLimited = await rateLimitUtils.checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000); // 3 attempts per 15 minutes
    
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again later.',
        code: 'RATE_LIMITED'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status === UserStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Generate new verification token
    const verificationToken = codeUtils.generateOTP(32);

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken
      }
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, {
      username: user.firstName || user.username,
      verificationCode: verificationToken,
      verificationUrl: `${config.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      code: 'SERVER_ERROR'
    });
  }
}