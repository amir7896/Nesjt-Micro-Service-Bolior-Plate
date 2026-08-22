import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/common';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicator: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return indicator.down({
          transport: 'Redis',
          message: 'Unexpected ping response',
        });
      }
      return indicator.up({ transport: 'Redis' });
    } catch (error) {
      return indicator.down({
        transport: 'Redis',
        message:
          error instanceof Error ? error.message : 'Redis is unreachable',
      });
    }
  }
}
