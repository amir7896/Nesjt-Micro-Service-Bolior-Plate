import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationMember } from '../database/entities/conversation-member.entity';
import { Message } from '../database/entities/message.entity';
import { MessageHide } from '../database/entities/message-hide.entity';
import { MessageReaction } from '../database/entities/message-reaction.entity';
import { UserBlock } from '../database/entities/user-block.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationMember,
      Message,
      MessageHide,
      MessageReaction,
      UserBlock,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
