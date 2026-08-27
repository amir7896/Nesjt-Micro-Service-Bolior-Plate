import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { CHAT_QUEUE, createRmqServerOptions, listenHttpWithRetry } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('ChatService');

  app.enableShutdownHooks();
  app.connectMicroservice(createRmqServerOptions(config, CHAT_QUEUE));
  await app.startAllMicroservices();

  const port = config.get<number>('CHAT_HTTP_PORT', 3004);
  const httpUp = await listenHttpWithRetry(app, port, logger);

  logger.log(
    httpUp
      ? `Chat microservice connected to RabbitMQ queue "${CHAT_QUEUE}" and listening on :${port}`
      : `Chat microservice connected to RabbitMQ queue "${CHAT_QUEUE}" (HTTP :${port} unavailable — RMQ consumer still running)`,
  );
}

void bootstrap();
