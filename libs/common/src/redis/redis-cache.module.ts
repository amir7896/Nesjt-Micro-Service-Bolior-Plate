import { CacheModule } from '@nestjs/cache-manager';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';

@Module({})
export class RedisCacheModule {
  static register(): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        CacheModule.registerAsync({
          isGlobal: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const host = config.getOrThrow<string>('REDIS_HOST');
            const port = config.get<number>('REDIS_PORT', 6379);
            const password = config.get<string>('REDIS_PASSWORD');
            const db = config.get<number>('REDIS_DB', 0);
            const auth = password ? `:${encodeURIComponent(password)}@` : '';

            return {
              stores: [new KeyvRedis(`redis://${auth}${host}:${port}/${db}`)],
              ttl: config.get<number>('CACHE_TTL_SECONDS', 60) * 1000,
            };
          },
        }),
      ],
      exports: [CacheModule],
    };
  }
}
