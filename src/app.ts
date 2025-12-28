import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config/config';
import prisma from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { initializeFirebase } from './services/firebase.service';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import userDashboardRoutes from './routes/user-dashboard.routes';
import walletRoutes from './routes/wallet.routes';
import postRoutes from './routes/post.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';
import activityRoutes from './routes/activity.routes';
import vtuRoutes from './routes/vtu.routes';
import reportRoutes from './routes/report.routes';
import webhookRoutes from './routes/webhook.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import cryptoRoutes from './routes/crypto.routes';
import testRoutes from './routes/test.routes';
import escrowRoutes from './routes/escrow.routes';
import adminKycRoutes from './routes/admin-kyc.routes';
import verificationRoutes from './routes/verification.routes';
import refundRoutes from './routes/refund.routes';

const app = express();

// Initialize Firebase for push notifications
initializeFirebase();

// Trust proxy for ngrok and other reverse proxies
app.set('trust proxy', true);

// Simple CORS - allow everything
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

// Rate limiting - disabled for development with ngrok
// const limiter = rateLimit({
//   windowMs: config.RATE_LIMIT_WINDOW_MS,
//   max: config.RATE_LIMIT_MAX_REQUESTS,
//   message: {
//     error: 'Too many requests from this IP, please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (disabled in test environment)
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Root endpoint
app.get('/', (req: any, res: any) => {
  res.status(200).json({
    name: 'Lordmoon API',
    version: '1.0.1',
    status: 'running',
    message: 'API is operational',
    endpoints: {
      health: '/health',
      api: '/api/*',
      test: '/api/test/ping'
    },
    timestamp: new Date().toISOString(),
  });
});

// Simple test endpoint
app.get('/api/test/ping', (req: any, res: any) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

// Test database connection
app.get('/api/test/db', async (req: any, res: any) => {
  try {
    const count = await prisma.user.count();
    res.status(200).json({
      success: true,
      message: 'Database connected',
      userCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userDashboardRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/test', testRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/refund', refundRoutes);
app.use('/api/admin-temp', adminKycRoutes); // TEMPORARY - DELETE AFTER USE
console.log('🔵 Registering verification routes at /api/verification');
app.use('/api/verification', verificationRoutes);
console.log('✅ Verification routes registered');

// Proxy middleware for frontend - only in development
if (config.NODE_ENV === 'development') {
  const frontendProxy = createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    ws: true
  });

  // Apply proxy to all routes that don't start with /api or /health
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    return frontendProxy(req, res, next);
  });
}

// 404 handler for API routes only
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;