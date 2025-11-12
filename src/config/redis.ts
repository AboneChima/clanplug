import { createClient } from 'redis';
import config from './config';

// Redis client instance
let redisClient: ReturnType<typeof createClient>;

// Create Redis client
export const createRedisClient = (): ReturnType<typeof createClient> => {
  const client = createClient({
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries: number): number | Error => {
        if (retries > 10) {
          console.error('❌ Redis connection failed after 10 retries');
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 50, 1000);
      },
    },
  });

  // Error handling
  client.on('error', (error) => {
    console.error('❌ Redis Client Error:', error);
  });

  client.on('connect', () => {
    console.log('🔄 Redis Client connecting...');
  });

  client.on('ready', () => {
    console.log('✅ Redis Client connected and ready');
  });

  client.on('end', () => {
    console.log('🔌 Redis Client connection ended');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis Client reconnecting...');
  });

  return client;
};

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createRedisClient();
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    
    // In development, continue without Redis
    if (config.isDevelopment) {
      console.warn('⚠️ Continuing without Redis in development mode');
      return;
    }
    
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Redis disconnection failed:', error);
  }
};

// Get Redis client instance
export const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Redis utility functions
export const redisUtils = {
  // Set key with expiration
  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, skipping set operation');
        return;
      }
      
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      console.error('❌ Redis set error:', error);
    }
  },

  // Get key value
  async get(key: string): Promise<string | null> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, returning null');
        return null;
      }
      
      return await redisClient.get(key);
    } catch (error) {
      console.error('❌ Redis get error:', error);
      return null;
    }
  },

  // Delete key
  async del(key: string): Promise<void> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, skipping delete operation');
        return;
      }
      
      await redisClient.del(key);
    } catch (error) {
      console.error('❌ Redis delete error:', error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, returning false');
        return false;
      }
      
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis exists error:', error);
      return false;
    }
  },

  // Set expiration for existing key
  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, skipping expire operation');
        return;
      }
      
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.error('❌ Redis expire error:', error);
    }
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, returning 1');
        return 1;
      }
      
      return await redisClient.incr(key);
    } catch (error) {
      console.error('❌ Redis incr error:', error);
      return 1;
    }
  },

  // Hash operations
  async hSet(key: string, field: string, value: string): Promise<void> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, skipping hSet operation');
        return;
      }
      
      await redisClient.hSet(key, field, value);
    } catch (error) {
      console.error('❌ Redis hSet error:', error);
    }
  },

  async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, returning undefined');
        return undefined;
      }
      
      return await redisClient.hGet(key, field);
    } catch (error) {
      console.error('❌ Redis hGet error:', error);
      return undefined;
    }
  },

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      if (!redisClient || !redisClient.isOpen) {
        console.warn('⚠️ Redis not available, returning empty object');
        return {};
      }
      
      return await redisClient.hGetAll(key);
    } catch (error) {
      console.error('❌ Redis hGetAll error:', error);
      return {};
    }
  }
};

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});

export { redisClient };
export default redisUtils;