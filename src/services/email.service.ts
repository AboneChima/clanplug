import nodemailer from 'nodemailer';
import { config } from '../config/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter with improved configuration
const createTransporter = () => {
  // If no email config, log to console instead
  if (!config.SMTP_HOST || !config.SMTP_USER) {
    console.log('⚠️  Email not configured. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE, // false for port 587, true for 465
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    },
    // Additional settings to avoid spam
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    // Connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  // If no transporter, log email to console
  if (!transporter) {
    console.log('\n📧 ===== EMAIL (Not Sent - No Config) =====');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html);
    console.log('==========================================\n');
    return;
  }

  try {
    // Improved email headers to avoid spam
    const mailOptions = {
      from: `"${config.APP_NAME} (No Reply)" <${config.SMTP_USER}>`, // Indicate no-reply
      to: options.to,
      subject: options.subject,
      html: options.html + `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            ⚠️ This is an automated message. Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
            For support, contact us through the app or visit our website.
          </p>
        </div>
      `,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': config.APP_NAME,
        'Reply-To': 'noreply@clanplug.com', // No-reply address
        'X-Auto-Response-Suppress': 'All' // Suppress auto-replies
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to} - Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};
