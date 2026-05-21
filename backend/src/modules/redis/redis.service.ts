import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  getClient(): Redis | null {
    if (!process.env.REDIS_URL) return null;

    if (!this.client) {
      this.client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.client.connect().catch(() => {
        this.client = null;
      });
    }
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const client = this.getClient();
    if (!client) return;
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;
    return client.get(key);
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
