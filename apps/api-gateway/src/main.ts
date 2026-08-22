import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import {
  ApiErrorResponseSchema,
  ApiSuccessEnvelopeSchema,
  PaginationMetaSchema,
} from '@app/common';
import {
  AuthResultSchema,
  AuthUserSchema,
  TokenPairSchema,
} from './auth/swagger/auth.schema';
import { AppModule } from './app.module';
import {
  HealthInfoSchema,
  RabbitMqHealthSchema,
  RedisHealthSchema,
} from './health/swagger/health.schema';
import { UserProfileSchema } from './users/swagger/users.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('ApiGateway');

  app.useLogger(app.get(PinoLogger));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  const origin = config.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin:
      origin === '*' ? true : origin.split(',').map((item) => item.trim()),
    credentials: true,
  });

  const prefix = config.get<string>('GATEWAY_GLOBAL_PREFIX', 'api');
  app.setGlobalPrefix(prefix);
  app.enableShutdownHooks();

  if (
    config.get<boolean>(
      'SWAGGER_ENABLED',
      process.env.NODE_ENV !== 'production',
    )
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS Microservices API')
      .setDescription(
        'API Gateway for Auth and User microservices. Authentication uses JWT. Inter-service traffic is brokered through RabbitMQ. Redis is used for cache and token blacklist.',
      )
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token from /auth/login',
      })
      .addTag('Auth')
      .addTag('Users')
      .addTag('Health')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [
        ApiSuccessEnvelopeSchema,
        ApiErrorResponseSchema,
        PaginationMetaSchema,
        AuthUserSchema,
        AuthResultSchema,
        TokenPairSchema,
        UserProfileSchema,
        HealthInfoSchema,
        RabbitMqHealthSchema,
        RedisHealthSchema,
      ],
    });
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const http = app.getHttpAdapter().getInstance();
  const docsPath = `/${prefix}/docs`;
  for (const from of ['/', `/${prefix}`, '/api-docs']) {
    http.get(
      from,
      (
        _req: unknown,
        res: { redirect: (status: number, url: string) => void },
      ) => {
        res.redirect(302, docsPath);
      },
    );
  }

  const port = config.get<number>('GATEWAY_PORT', 3000);
  await app.listen(port);
  logger.log(`API Gateway running on http://localhost:${port}/${prefix}`);
  logger.log(`Swagger docs available at http://localhost:${port}${docsPath}`);
}

void bootstrap();
