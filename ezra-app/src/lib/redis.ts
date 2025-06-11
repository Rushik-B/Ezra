import IORedis from 'ioredis';

// This automatically uses the REDIS_URL from Heroku's environment variables.
// For local development, you can set REDIS_URL=redis://localhost:6379
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // This is important to prevent jobs from failing during a brief Redis disconnect.
  maxRetriesPerRequest: null,
  // Connection pool settings for better performance
  lazyConnect: true,
  keepAlive: 30000,
  enableOfflineQueue: false,
});

// Handle connection events
redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisConnection.on('error', (err: Error) => {
  console.error('❌ Redis connection error:', err);
});

redisConnection.on('close', () => {
  console.log('🔌 Redis connection closed');
});

export default redisConnection; 