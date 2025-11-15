import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config/config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { startTransactionCleanupJob, stopTransactionCleanupJob } from './jobs/transaction-cleanup.job';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import postRoutes from './routes/post.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';
import activityRoutes from './routes/activity.routes';
import vtuRoutes from './routes/vtu.routes';
import reportRoutes from './routes/report.routes';
import webhookRoutes from './routes/webhook.routes';
import paymentRoutes from './routes/payment.routes';
import cryptoRoutes from './routes/crypto.routes';
import notificationRoutes from './routes/notification.routes';
import testRoutes from './routes/test.routes';
import userDashboardRoutes from './routes/user-dashboard.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import storyRoutes from './routes/story.routes';
import followRoutes from './routes/follow.routes';
import manualVerifyRoutes from './routes/manual-verify.routes';
import kycRoutes from './routes/kyc.routes';
import escrowRoutes from './routes/escrow.routes';

const app = express();

// Simple CORS - allow everything (MUST be first)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request from:', origin);
    res.status(204).end();
    return;
  }
  
  next();
});

// Security middleware - disabled for now
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// OLD CORS configuration - replaced with manual headers above
/*
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.FRONTEND_URL,
      config.APP_URL,
      'http://localhost:3005',
      'http://localhost:3000',
      'http://localhost:8080', // Debug server
    ].filter(Boolean);

    // Allow non-browser or same-origin requests (no Origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
*/

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

// Logging middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// API routes
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
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/test', testRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/manual-verify', manualVerifyRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/escrow', escrowRoutes);

// Proxy middleware for frontend - only in development
if (config.NODE_ENV === 'development' && config.FRONTEND_URL) {
  const frontendProxy = createProxyMiddleware({
    target: config.FRONTEND_URL,
    changeOrigin: true,
    ws: true
  });

  // Apply proxy to all routes that don't start with /api or /health
  app.use((req, res, next) => {
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

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    console.log(`📍 Environment: ${config.NODE_ENV}`);
    console.log(`📍 Port: ${config.PORT}`);
    
    // Try to connect to database, but continue if unavailable
    try {
      await connectDatabase();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.warn('⚠️ Database connection failed, continuing without DB:', error instanceof Error ? error.message : error);
    }

    // Try to connect to Redis, but continue if unavailable
    try {
      await connectRedis();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, continuing without Redis:', error instanceof Error ? error.message : error);
    }

    // Start HTTP server regardless, so health and static routes are available
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📱 Frontend URL: ${config.FRONTEND_URL || 'Not set'}`);
      
      // Start transaction cleanup job
      try {
        startTransactionCleanupJob();
        console.log('✅ Transaction cleanup job started');
      } catch (error) {
        console.warn('⚠️ Failed to start cleanup job:', error);
      }
    });

    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      stopTransactionCleanupJob();
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      stopTransactionCleanupJob();
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
