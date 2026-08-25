import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/common';
import type { AuthUserView } from '@app/contracts';

@Injectable()
export class AuthSessionCache {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async get(userId: string): Promise<AuthUserView | null> {
    const raw = await this.redis.get(this.key(userId));
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUserView;
    } catch {
      await this.redis.del(this.key(userId));
      return null;
    }
  }

  async set(user: AuthUserView): Promise<void> {
    const ttl = this.config.get<number>('AUTH_VALIDATE_CACHE_SECONDS', 15);
    await this.redis.set(this.key(user.id), JSON.stringify(user), 'EX', ttl);
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  private key(userId: string): string {
    return `auth:validate:${userId}`;
  }
}
