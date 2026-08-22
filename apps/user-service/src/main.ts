import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { USER_QUEUE, createRmqServerOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('UserService');

  app.enableShutdownHooks();
  app.connectMicroservice(createRmqServerOptions(config, USER_QUEUE));
  await app.startAllMicroservices();

  const port = config.get<number>('USER_HTTP_PORT', 3002);
  await app.listen(port);

  logger.log(
    `User microservice connected to RabbitMQ queue "${USER_QUEUE}" and listening on :${port}`,
  );
}

void bootstrap();
