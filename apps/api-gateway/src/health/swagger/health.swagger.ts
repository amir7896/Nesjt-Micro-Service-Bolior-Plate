import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses, ApiWrappedResponse } from '@app/common';
import {
  HealthInfoSchema,
  RabbitMqHealthSchema,
  RedisHealthSchema,
} from './health.schema';

export const HealthDocs = () =>
  applyDecorators(
    ApiTags('Health'),
    ApiErrorResponses(),
    ApiExtraModels(RabbitMqHealthSchema, RedisHealthSchema),
  );

export const HealthCheckDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Liveness and dependency readiness',
      description:
        'Confirms the API Gateway is up and can reach RabbitMQ and Redis. RabbitMQ brokers Auth and User traffic; Redis holds cache and the access-token blacklist.',
    }),
    ApiWrappedResponse(HealthInfoSchema, {
      description: 'Gateway is healthy and RabbitMQ plus Redis are reachable',
    }),
  );
