import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { HEALTH_SUCCESS_MESSAGES, Public } from '@app/common';
import { RabbitMqHealthIndicator } from './rabbitmq.health';
import { RedisHealthIndicator } from './redis.health';
import { HealthCheckDocs, HealthDocs } from './swagger/health.swagger';

@HealthDocs()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly rabbitmq: RabbitMqHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  @HealthCheck()
  @HealthCheckDocs()
  async check() {
    const data = await this.health.check([
      () => this.rabbitmq.isHealthy('rabbitmq'),
      () => this.redis.isHealthy('redis'),
    ]);
    return { message: HEALTH_SUCCESS_MESSAGES.HEALTHY, data };
  }
}
