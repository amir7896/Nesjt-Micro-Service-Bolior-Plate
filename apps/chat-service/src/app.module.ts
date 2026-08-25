import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { chatEnvSchema } from '@app/common';
import { createTypeOrmOptions } from '@app/database';
import { ChatModule } from './chat/chat.module';
import { Conversation } from './database/entities/conversation.entity';
import { ConversationMember } from './database/entities/conversation-member.entity';
import { Message } from './database/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: chatEnvSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmOptions({
          host: config.getOrThrow<string>('POSTGRES_HOST'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          username: config.getOrThrow<string>('POSTGRES_USER'),
          password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: config.getOrThrow<string>('CHAT_POSTGRES_DATABASE'),
          entities: [Conversation, ConversationMember, Message],
          poolMax: config.get<number>('POSTGRES_POOL_MAX', 20),
          poolMin: config.get<number>('POSTGRES_POOL_MIN', 2),
        }),
    }),
    ChatModule,
  ],
})
export class AppModule {}
