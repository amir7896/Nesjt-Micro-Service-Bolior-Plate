import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const AUTH_QUEUE = 'auth_queue';
export const USER_QUEUE = 'user_queue';
export const CHAT_QUEUE = 'chat_queue';

export function buildRmqUrl(config: ConfigService): string {
  const user = encodeURIComponent(config.get<string>('RABBITMQ_USER', 'nest'));
  const password = encodeURIComponent(
    config.get<string>('RABBITMQ_PASSWORD', 'nest'),
  );
  const host = config.get<string>('RABBITMQ_HOST', 'localhost');
  const port = config.get<number>('RABBITMQ_PORT', 5672);
  const vhost = config.get<string>('RABBITMQ_VHOST', '/');
  const path = vhost === '/' ? '' : `/${encodeURIComponent(vhost)}`;

  return `amqp://${user}:${password}@${host}:${port}${path}`;
}

function baseRmqOptions(config: ConfigService, queue: string) {
  return {
    urls: [buildRmqUrl(config)],
    queue,
    queueOptions: {
      durable: true,
    },
    prefetchCount: config.get<number>('RABBITMQ_PREFETCH', 16),
    persistent: true,
    socketOptions: {
      heartbeatIntervalInSeconds: 30,
      reconnectTimeInSeconds: 5,
    },
  };
}

/** Microservice workers. Manual ack is allowed on the request queue. */
export function createRmqServerOptions(
  config: ConfigService,
  queue: string,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      ...baseRmqOptions(config, queue),
      noAck: false,
    },
  };
}

/**
 * API Gateway ClientProxy.
 * Reply queues cannot use manual ack — RabbitMQ returns 406 PRECONDITION_FAILED.
 */
export function createRmqClientOptions(
  config: ConfigService,
  queue: string,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      ...baseRmqOptions(config, queue),
      noAck: true,
    },
  };
}
