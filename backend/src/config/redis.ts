import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
};

export const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
  // Don't crash the app if Redis is unavailable in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.warn('Redis unavailable, but continuing in development mode');
  }
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

export default redis;

