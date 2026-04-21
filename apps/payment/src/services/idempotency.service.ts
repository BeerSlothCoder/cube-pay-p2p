import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

// TTL for idempotency keys: 7 days (matches Revolut retry window)
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class IdempotencyService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    });
  }

  async isProcessed(key: string): Promise<boolean> {
    const value = await this.redis.get(`idempotency:${key}`);
    return value !== null;
  }

  async markProcessed(key: string): Promise<void> {
    // SET NX EX — atomic: only sets if key doesn't exist
    await this.redis.set(
      `idempotency:${key}`,
      '1',
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
      'NX',
    );
  }
}
