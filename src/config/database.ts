import { PrismaClient } from '@prisma/client';
import config from './config';

// Global variable to store Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
export const prisma = globalThis.__prisma || new PrismaClient({
  log: config.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// In development, store the client in global to prevent multiple instances
if (config.isDevelopment) {
  globalThis.__prisma = prisma;
}

// Database connection function
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Database disconnection function
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;