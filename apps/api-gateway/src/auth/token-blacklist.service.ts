import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, parseDurationSeconds } from '@app/common';
import { createHash } from 'crypto';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async revokeAccessToken(token: string): Promise<void> {
    const key = this.key(token);
    const ttl = parseDurationSeconds(
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '1d'),
    );
    await this.redis.set(key, '1', 'EX', ttl);
  }

  async isRevoked(token: string): Promise<boolean> {
    const exists = await this.redis.exists(this.key(token));
    return exists === 1;
  }

  private key(token: string): string {
    return `gateway:token:blacklist:${createHash('sha256').update(token).digest('hex')}`;
  }
}
