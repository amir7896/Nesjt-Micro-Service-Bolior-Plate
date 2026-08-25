import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RabbitMqHealthSchema {
  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ example: 'RabbitMQ' })
  transport!: string;

  @ApiProperty({ type: [String], example: ['auth_queue', 'user_queue', 'chat_queue'] })
  queues!: string[];
}

export class RedisHealthSchema {
  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ example: 'Redis' })
  transport!: string;

  @ApiPropertyOptional({ example: 'Redis is unreachable' })
  message?: string;
}

export class HealthInfoSchema {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      rabbitmq: {
        status: 'up',
        transport: 'RabbitMQ',
        queues: ['auth_queue', 'user_queue', 'chat_queue'],
      },
      redis: {
        status: 'up',
        transport: 'Redis',
      },
    },
  })
  info!: Record<string, RabbitMqHealthSchema | RedisHealthSchema>;

  @ApiProperty({ type: 'object', additionalProperties: true, example: {} })
  error!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  details!: Record<string, RabbitMqHealthSchema | RedisHealthSchema>;
}
