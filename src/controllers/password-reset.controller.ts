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

      // Send email with improved template
      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: `Reset Your ${config.APP_NAME} Password`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 30px 40px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">🔐 Password Reset</h1>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi <strong>${user.firstName || user.username}</strong>,</p>
                          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">We received a request to reset your password. Click the button below to create a new password:</p>
                          <!-- Button -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
                              </td>
                            </tr>
                          </table>
                          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">Or copy and paste this link into your browser:</p>
                          <p style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; color: #2563eb; font-size: 13px; word-break: break-all; margin: 10px 0 25px;">${resetUrl}</p>
                          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
                            <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">⏱️ This link will expire in <strong>1 hour</strong> for security reasons.</p>
                          </div>
                          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px;">© ${new Date().getFullYear()} ${config.APP_NAME}. All rights reserved.</p>
                          <p style="color: #adb5bd; font-size: 12px; margin: 0;">This is an automated message, please do not reply.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
          text: `Hi ${user.firstName || user.username},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n© ${new Date().getFullYear()} ${config.APP_NAME}`
        });
        console.log(`✅ Password reset email sent to ${user.email}`);
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
          subject: `Your ${config.APP_NAME} Password Was Changed`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">✅ Password Changed</h1>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi <strong>${user.firstName || user.username}</strong>,</p>
                          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">Your password has been changed successfully. You can now log in with your new password.</p>
                          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                            <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;">🔒 Your account is now secure with your new password.</p>
                          </div>
                          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0;">
                            <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;"><strong>⚠️ Didn't make this change?</strong><br>If you didn't change your password, please contact our support team immediately.</p>
                          </div>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="color: #6c757d; font-size: 13px; margin: 0 0 10px;">© ${new Date().getFullYear()} ${config.APP_NAME}. All rights reserved.</p>
                          <p style="color: #adb5bd; font-size: 12px; margin: 0;">This is an automated message, please do not reply.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
          text: `Hi ${user.firstName || user.username},\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact support immediately.\n\n© ${new Date().getFullYear()} ${config.APP_NAME}`
        });
        console.log(`✅ Password confirmation email sent to ${user.email}`);
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
