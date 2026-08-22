import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../constants/tokens';

@Injectable()
class RedisLifecycle implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === 'ready' || this.redis.status === 'connect') {
      await this.redis.quit();
      return;
    }
    this.redis.disconnect();
  }
}

@Global()
@Module({})
export class RedisModule {
  static register(): DynamicModule {
    return {
      module: RedisModule,
      global: true,
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService) =>
            new Redis({
              host: config.getOrThrow<string>('REDIS_HOST'),
              port: config.get<number>('REDIS_PORT', 6379),
              password: config.get<string>('REDIS_PASSWORD') || undefined,
              db: config.get<number>('REDIS_DB', 0),
              maxRetriesPerRequest: 3,
              lazyConnect: false,
            }),
        },
        RedisLifecycle,
      ],
      exports: [REDIS_CLIENT],
    };
  }
}
