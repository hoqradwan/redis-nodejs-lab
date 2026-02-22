const Redis = require('ioredis');

// Create Redis client with configuration
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Event handlers for connection monitoring
redis.on('connect', () => {
  console.log('✓ Redis client connected successfully');
});

redis.on('ready', () => {
  console.log('✓ Redis client ready to accept commands');
});

redis.on('error', (err) => {
  console.error('✗ Redis client error:', err.message);
});

redis.on('close', () => {
  console.log('✗ Redis client connection closed');
});

redis.on('reconnecting', () => {
  console.log('⟳ Redis client attempting to reconnect...');
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

module.exports = redis;
