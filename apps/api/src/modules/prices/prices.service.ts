import { Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { SupportedCurrency } from '@cubepay/shared-types';

@Injectable()
export class PricesService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      lazyConnect: true,
    });
  }

  async getPrice(currency: SupportedCurrency) {
    // Price oracle service writes: price:{CURRENCY}:EUR with 10s TTL
    const key = `price:${currency}:EUR`;
    const raw = await this.redis.get(key);

    if (!raw) throw new NotFoundException(`No price feed for ${currency}`);

    const feed = JSON.parse(raw) as {
      price: string;
      source: string;
      fetchedAt: number;
      signature: string;
    };

    return {
      currency,
      fiatCurrency: 'EUR',
      price: feed.price,
      source: feed.source,
      fetchedAt: feed.fetchedAt,
    };
  }
}
