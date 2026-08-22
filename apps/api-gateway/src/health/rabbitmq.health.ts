import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { connect } from 'amqplib';
import { AUTH_QUEUE, USER_QUEUE, buildRmqUrl } from '@app/common';

@Injectable()
export class RabbitMqHealthIndicator {
  constructor(
    private readonly healthIndicator: HealthIndicatorService,
    private readonly config: ConfigService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    const url = buildRmqUrl(this.config);

    try {
      const connection = await connect(url);
      await connection.close();
      return indicator.up({
        transport: 'RabbitMQ',
        queues: [AUTH_QUEUE, USER_QUEUE],
      });
    } catch (error) {
      return indicator.down({
        transport: 'RabbitMQ',
        message:
          error instanceof Error ? error.message : 'RabbitMQ is unreachable',
      });
    }
  }
}
