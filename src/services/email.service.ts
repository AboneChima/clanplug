import * as nodemailer from 'nodemailer';
import config from '../config/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  username: string;
  verificationCode: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  username: string;
  resetCode: string;
  resetUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
          from: `"${config.APP_NAME}" <${config.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - ${config.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.APP_NAME}</h1>
            <p>Welcome to the future of gaming marketplace!</p>
          </div>
          <div class="content">
            <h2>Hi ${data.username}!</h2>
            <p>Thank you for joining ${config.APP_NAME}. To complete your registration, please verify your email address.</p>
            
            <p>Your verification code is:</p>
            <div class="code">${data.verificationCode}</div>
            
            <p>Or click the button below to verify automatically:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
            
            <p><strong>This verification code will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with ${config.APP_NAME}, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${config.APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${data.username}!
      
      Thank you for joining ${config.APP_NAME}. To complete your registration, please verify your email address.
      
      Your verification code is: ${data.verificationCode}
      
      Or visit this link: ${data.verificationUrl}
      
      This verification code will expire in 24 hours.
      
      If you didn't create an account with ${config.APP_NAME}, please ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: `Verify Your Email - ${config.APP_NAME}`,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ${config.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.APP_NAME}</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hi ${data.username}!</h2>
            <p>We received a request to reset your password for your ${config.APP_NAME} account.</p>
            
            <p>Your password reset code is:</p>
            <div class="code">${data.resetCode}</div>
            
            <p>Or click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This reset code will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this code with anyone</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${config.APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${data.username}!
      
      We received a request to reset your password for your ${config.APP_NAME} account.
      
      Your password reset code is: ${data.resetCode}
      
      Or visit this link: ${data.resetUrl}
      
      This reset code will expire in 1 hour.
      
      If you didn't request this reset, please ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: `Reset Your Password - ${config.APP_NAME}`,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${config.APP_NAME}!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 Welcome to ${config.APP_NAME}!</h1>
            <p>Your gaming marketplace journey starts here</p>
          </div>
          <div class="content">
            <h2>Hi ${username}!</h2>
            <p>Welcome to ${config.APP_NAME}! We're excited to have you join our community of gamers and traders.</p>
            
            <div class="features">
              <h3>What you can do now:</h3>
              <div class="feature">🎯 <strong>Buy & Sell Game Accounts</strong> - Trade your gaming accounts securely</div>
              <div class="feature">💰 <strong>Manage Your Wallet</strong> - Deposit, withdraw, and track your funds</div>
              <div class="feature">🔒 <strong>Secure Escrow</strong> - Safe transactions with built-in protection</div>
              <div class="feature">📱 <strong>VTU Services</strong> - Buy airtime, data, and pay bills</div>
              <div class="feature">💬 <strong>Chat & Connect</strong> - Communicate with other traders</div>
            </div>
            
            <a href="${config.APP_URL}" class="button">Start Exploring</a>
            
            <p>Need help getting started? Check out our guides or contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ${config.APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🎮 Welcome to ${config.APP_NAME}!`,
      html,
    });
  }
}

export const emailService = new EmailService();
export default emailService;