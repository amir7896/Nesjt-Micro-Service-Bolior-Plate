import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMember } from './entities/conversation-member.entity';
import { Message } from './entities/message.entity';
import { CreateChatSchema1730000000000 } from './migrations/1730000000000-CreateChatSchema';
import { AddChatSeenAndMessageType1730000001000 } from './migrations/1730000001000-AddChatSeenAndMessageType';
import { AddChatScaleIndexes1730000002000 } from './migrations/1730000002000-AddChatScaleIndexes';

config({
  path: [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../../../../.env'),
  ],
});

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'nest',
  password: process.env.POSTGRES_PASSWORD ?? 'nest',
  database: process.env.CHAT_POSTGRES_DATABASE ?? 'nest_chat',
  entities: [Conversation, ConversationMember, Message],
  migrations: [
    CreateChatSchema1730000000000,
    AddChatSeenAndMessageType1730000001000,
    AddChatScaleIndexes1730000002000,
  ],
  synchronize: false,
});
