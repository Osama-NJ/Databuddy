import { SuperJSON } from 'superjson';
import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

// Initialize logger
const logger = console;

const options: RedisOptions = {
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3
};

export { Redis };

interface ExtendedRedis extends Redis {
  getJson: <T = any>(key: string) => Promise<T | null>;
  setJson: <T = any>(
    key: string,
    value: T,
    expireInSec: number,
  ) => Promise<void>;
}

const createRedisClient = (
  url: string,
  overrides: RedisOptions = {},
): ExtendedRedis => {
  
  const client = new Redis(url, {
    ...options,
    ...overrides,
  }) as ExtendedRedis;

  client.on('error', (error) => {
    logger.error('Redis Client Error:', error);
  });

  client.on('connect', () => {
    // logger.debug('Redis client connected');
  });

  client.on('ready', () => {
    // logger.debug('Redis client ready');
  });

  client.on('reconnecting', () => {
    // logger.debug('Redis client reconnecting');
  });

  client.getJson = async <T = any>(key: string): Promise<T | null> => {
    const value = await client.get(key);
    if (!value) return null;
    
    try {
      const res = SuperJSON.parse(value) as T;
      
      // Check for empty collections
      if ((Array.isArray(res) && res.length === 0) || 
          (res && typeof res === 'object' && Object.keys(res).length === 0)) {
        return null;
      }
      
      return res;
    } catch (err) {
      logger.error(`Error parsing JSON for key ${key}:`, err);
      return null;
    }
  };

  client.setJson = async <T = any>(
    key: string,
    value: T,
    expireInSec: number,
  ): Promise<void> => {
    await client.setex(key, expireInSec, SuperJSON.stringify(value));
  };

  return client;
};

// Singleton instance
let redisInstance: ExtendedRedis | null = null;

// Create singleton Redis instance
export function getRedisCache(): ExtendedRedis {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is required');
    }
    
    redisInstance = createRedisClient(redisUrl, options);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      if (redisInstance) {
        redisInstance.disconnect();
        redisInstance = null;
      }
    });
    
    process.on('SIGTERM', () => {
      if (redisInstance) {
        redisInstance.disconnect();
        redisInstance = null;
      }
    });
  }
  
  return redisInstance;
}

// Export the singleton instance directly
export const redis = getRedisCache();

// Helper for distributed locks
export async function getLock(key: string, value: string, timeout: number): Promise<boolean> {
  const lock = await redis.set(key, value, 'PX', timeout, 'NX');
  return lock === 'OK';
}

// Helper to release lock
export async function releaseLock(key: string, value: string): Promise<boolean> {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await redis.eval(script, 1, key, value);
  return result === 1;
}

// Helper to get connection status
export function isRedisConnected(): boolean {
  return redisInstance?.status === 'ready';
}

// Helper to manually disconnect (for testing)
export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.disconnect();
    redisInstance = null;
  }
}