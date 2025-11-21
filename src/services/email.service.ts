import nodemailer from 'nodemailer';
import { config } from '../config/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
const createTransporter = () => {
  // If no email config, log to console instead
  if (!config.SMTP_HOST || !config.SMTP_USER) {
    console.log('⚠️  Email not configured. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransporter({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
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
    await transporter.sendMail({
      from: `"${config.APP_NAME}" <${config.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};
