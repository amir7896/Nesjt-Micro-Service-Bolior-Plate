import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import {
  AUTH_QUEUE,
  AUTH_SERVICE,
  CHAT_QUEUE,
  CHAT_SERVICE,
  USER_QUEUE,
  USER_SERVICE,
  createRmqClientOptions,
} from '@app/common';
import { MicroserviceProxy } from './microservice.proxy';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          createRmqClientOptions(config, AUTH_QUEUE),
      },
      {
        name: USER_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          createRmqClientOptions(config, USER_QUEUE),
      },
      {
        name: CHAT_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          createRmqClientOptions(config, CHAT_QUEUE),
      },
    ]),
  ],
  providers: [MicroserviceProxy],
  exports: [MicroserviceProxy],
})
export class ProxyModule {}
