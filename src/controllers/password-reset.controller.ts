import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../services/email.service';
import { config } from '../config/config';

const prisma = new PrismaClient();

export class PasswordResetController {
  // Request password reset
  async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpiry
        }
      });

      // Send email
      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Password Reset Request</h2>
              <p>Hi ${user.firstName || user.username},</p>
              <p>You requested to reset your password. Click the button below to reset it:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${resetUrl}</p>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${config.APP_NAME}. All rights reserved.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Continue anyway - don't expose email sending failures
      }

      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }

  // Verify reset token
  async verifyToken(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token'
        });
      }

      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const user = await prisma.user.findFirst({
        where: {
          resetToken: resetTokenHash,
          resetTokenExpiry: {
            gt: new Date()
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      return res.json({
        success: true,
        data: {
          email: user.email,
          firstName: user.firstName
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify token'
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const user = await prisma.user.findFirst({
        where: {
          resetToken: resetTokenHash,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      // Send confirmation email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Changed Successfully',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Password Changed Successfully</h2>
              <p>Hi ${user.firstName || user.username},</p>
              <p>Your password has been changed successfully.</p>
              <p>If you didn't make this change, please contact support immediately.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} ${config.APP_NAME}. All rights reserved.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }
}

export const passwordResetController = new PasswordResetController();
