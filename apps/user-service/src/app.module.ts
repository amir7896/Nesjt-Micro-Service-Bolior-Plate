import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { userEnvSchema } from '@app/common';
import { createTypeOrmOptions } from '@app/database';
import { UserProfile } from './database/entities/user-profile.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: userEnvSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmOptions({
          host: config.getOrThrow<string>('POSTGRES_HOST'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          username: config.getOrThrow<string>('POSTGRES_USER'),
          password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: config.getOrThrow<string>('USER_POSTGRES_DATABASE'),
          entities: [UserProfile],
        }),
    }),
    UsersModule,
  ],
})
export class AppModule {}
