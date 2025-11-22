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

  return nodemailer.createTransporter({
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
      from: `"${config.APP_NAME}" <${config.SMTP_USER}>`, // Use SMTP_USER as sender
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': config.APP_NAME,
        'Reply-To': config.SMTP_USER
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
