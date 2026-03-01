import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

function getRedis(): Redis {
  if (global.redis) return global.redis;
  const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    // Suppress connection errors at build time
    lazyConnect: true,
  });
  if (process.env.NODE_ENV !== 'production') global.redis = client;
  return client;
}

export default getRedis();
