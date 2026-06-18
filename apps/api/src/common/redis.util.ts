export interface RedisConnection {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/** Parse a redis:// URL into ioredis connection options. */
export function parseRedisUrl(url: string): RedisConnection {
  const u = new URL(url);
  return {
    host: u.hostname || '127.0.0.1',
    port: u.port ? Number(u.port) : 6379,
    username: u.username || undefined,
    password: u.password || undefined,
  };
}
