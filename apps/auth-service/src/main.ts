import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AUTH_QUEUE, createRmqServerOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('AuthService');

  app.enableShutdownHooks();
  app.connectMicroservice(createRmqServerOptions(config, AUTH_QUEUE));
  await app.startAllMicroservices();

  const port = config.get<number>('AUTH_HTTP_PORT', 3001);
  await app.listen(port);

  logger.log(
    `Auth microservice connected to RabbitMQ queue "${AUTH_QUEUE}" and listening on :${port}`,
  );
}

void bootstrap();
