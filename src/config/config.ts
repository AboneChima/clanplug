import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@lordmoon.com',
  
  // Payment Gateway Configuration
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
  FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY || '',
  FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET || '',
  MONNIFY_API_KEY: process.env.MONNIFY_API_KEY || '',
  MONNIFY_SECRET_KEY: process.env.MONNIFY_SECRET_KEY || '',
  MONNIFY_CONTRACT_CODE: process.env.MONNIFY_CONTRACT_CODE || '',
  
  // NowPayments Configuration
  NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY || '',
  NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET || '',
  NOWPAYMENTS_BASE_URL: process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io/v1',
  NOWPAYMENTS_SANDBOX: process.env.NOWPAYMENTS_SANDBOX === 'true',
  
  // ClubKonnect Configuration (VTU Provider)
  CLUBKONNECT_USERID: process.env.CLUBKONNECT_USERID || '',
  CLUBKONNECT_APIKEY: process.env.CLUBKONNECT_APIKEY || '',
  CLUBKONNECT_BASE_URL: process.env.CLUBKONNECT_BASE_URL || 'https://www.nellobytesystems.com',
  
  // KYC Verification Configuration
  DOJAH_API_KEY: process.env.DOJAH_API_KEY || '',
  DOJAH_APP_ID: process.env.DOJAH_APP_ID || '',
  DOJAH_BASE_URL: process.env.DOJAH_BASE_URL || 'https://api.dojah.io',
  IDENTITYPASS_API_KEY: process.env.IDENTITYPASS_API_KEY || '',
  IDENTITYPASS_BASE_URL: process.env.IDENTITYPASS_BASE_URL || 'https://api.myidentitypass.com',
  
  // Media Storage Configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY || 'default_admin_key',
  
  // Application Configuration
  APP_NAME: process.env.APP_NAME || 'Lordmoon',
  APP_URL: process.env.APP_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@lordmoon.com',
  
  // Service Fees Configuration
  DEPOSIT_FEE: parseFloat(process.env.DEPOSIT_FEE || '0.5'),
  WITHDRAWAL_FEE: parseFloat(process.env.WITHDRAWAL_FEE || '0.5'),
  TRANSACTION_FEE: parseFloat(process.env.TRANSACTION_FEE || '0.5'),
  
  // Currency Configuration
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'NGN',
  SUPPORTED_CURRENCIES: (process.env.SUPPORTED_CURRENCIES || 'NGN,USD').split(','),
  EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY || '',
  
  // Withdrawal Configuration
  FLUTTERWAVE_BASE_URL: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
  WITHDRAWAL_WEBHOOK_URL: process.env.WITHDRAWAL_WEBHOOK_URL || `${process.env.APP_URL || 'http://localhost:4000'}/api/withdrawal/webhook`,
  MIN_WITHDRAWAL_AMOUNT: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '100'), // Minimum ₦100
  MAX_WITHDRAWAL_AMOUNT: parseFloat(process.env.MAX_WITHDRAWAL_AMOUNT || '500000'), // Maximum ₦500,000
  DAILY_WITHDRAWAL_LIMIT: parseFloat(process.env.DAILY_WITHDRAWAL_LIMIT || '500000'), // Daily limit ₦500,000
  MONTHLY_WITHDRAWAL_LIMIT: parseFloat(process.env.MONTHLY_WITHDRAWAL_LIMIT || '5000000'), // Monthly limit ₦5,000,000
  
  // Monnify Configuration Validation
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  
  get isTest() {
    return this.NODE_ENV === 'test';
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export default config;