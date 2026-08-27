import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  BadRequestAppException,
  CHAT_SUCCESS_MESSAGES,
  CurrentUser,
  NotFoundAppException,
  ParseUuidPipe,
} from '@app/common';
import type { PaginatedResult } from '@app/common';
import { CHAT_PATTERNS, USER_PATTERNS } from '@app/contracts';
import type {
  ConversationView,
  SeenResultView,
  SendMessageResult,
} from '@app/contracts';
import { MicroserviceProxy } from '../infrastructure/proxy/microservice.proxy';
import { ChatGateway } from './chat.gateway';
import { ConversationCacheService } from './conversation-cache.service';
import {
  AddMembersDto,
  ChatPageQueryDto,
  CreateGroupChatDto,
  CreatePrivateChatDto,
  MarkSeenDto,
  SendMessageDto,
  TypingDto,
  UpdateGroupDto,
} from './dto/chat.dto';
import { PresenceService } from './presence.service';
import {
  AddMembersDocs,
  ChatDocs,
  CreateGroupChatDocs,
  CreatePrivateChatDocs,
  DeleteGroupDocs,
  GetConversationDocs,
  GetPresenceDocs,
  LeaveConversationDocs,
  ListConversationsDocs,
  ListMessagesDocs,
  MarkSeenDocs,
  RemoveMemberDocs,
  SendMessageDocs,
  TypingDocs,
  UpdateGroupDocs,
} from './swagger/chat.swagger';

@ChatDocs()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly proxy: MicroserviceProxy,
    private readonly presence: PresenceService,
    private readonly chatGateway: ChatGateway,
    private readonly conversationCache: ConversationCacheService,
  ) {}

  @Post('private')
  @HttpCode(HttpStatus.CREATED)
  @CreatePrivateChatDocs()
  async createPrivate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePrivateChatDto,
  ) {
    if (dto.userId === user.id) {
      throw new BadRequestAppException(
        'You cannot start a private chat with yourself',
      );
    }
    await this.assertUserExists(dto.userId);
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.CREATE_PRIVATE,
      { actorId: user.id, otherUserId: dto.userId },
    );
    await this.presence.attachToConversations([data]);
    return { message: CHAT_SUCCESS_MESSAGES.PRIVATE_READY, data };
  }

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @CreateGroupChatDocs()
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupChatDto,
  ) {
    await this.assertUsersExist(dto.memberIds.filter((id) => id !== user.id));
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.CREATE_GROUP,
      { actorId: user.id, name: dto.name, memberIds: dto.memberIds },
    );
    await this.presence.attachToConversations([data]);
    return { message: CHAT_SUCCESS_MESSAGES.GROUP_CREATED, data };
  }

  @Get('conversations')
  @ListConversationsDocs()
  async listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ChatPageQueryDto,
  ) {
    const data = await this.proxy.sendChat<PaginatedResult<ConversationView>>(
      CHAT_PATTERNS.LIST_CONVERSATIONS,
      {
        actorId: user.id,
        page: query.page,
        limit: query.limit,
      },
    );
    await this.presence.attachToConversations(data.items);
    return { message: CHAT_SUCCESS_MESSAGES.CONVERSATIONS_FETCHED, data };
  }

  @Get('presence/:userId')
  @GetPresenceDocs()
  async getPresence(@Param('userId', ParseUuidPipe) userId: string) {
    const data = await this.presence.getPresence(userId);
    return { message: CHAT_SUCCESS_MESSAGES.PRESENCE_FETCHED, data };
  }

  @Get('conversations/:id')
  @GetConversationDocs()
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.GET_CONVERSATION,
      { actorId: user.id, conversationId: id },
    );
    await this.presence.attachToConversations([data]);
    return { message: CHAT_SUCCESS_MESSAGES.CONVERSATION_FETCHED, data };
  }

  @Get('conversations/:id/messages')
  @ListMessagesDocs()
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Query() query: ChatPageQueryDto,
  ) {
    const data = await this.proxy.sendChat(CHAT_PATTERNS.LIST_MESSAGES, {
      actorId: user.id,
      conversationId: id,
      page: query.page,
      limit: query.limit,
    });
    return { message: CHAT_SUCCESS_MESSAGES.MESSAGES_FETCHED, data };
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @SendMessageDocs()
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.proxy.sendChat<SendMessageResult>(
      CHAT_PATTERNS.SEND_MESSAGE,
      {
        actorId: user.id,
        conversationId: id,
        body: dto.body,
        type: dto.type,
      },
    );
    const { recipientIds, ...data } = result;
    await this.conversationCache.setMemberIds(id, recipientIds);
    this.chatGateway.broadcastMessage(data, recipientIds);
    return { message: CHAT_SUCCESS_MESSAGES.MESSAGE_SENT, data };
  }

  @Post('conversations/:id/typing')
  @TypingDocs()
  async typing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: TypingDto,
  ) {
    const conversation = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.GET_CONVERSATION,
      {
        actorId: user.id,
        conversationId: id,
      },
    );
    const memberIds = conversation.members.map((member) => member.userId);
    await this.conversationCache.setMemberIds(id, memberIds);
    this.chatGateway.broadcastTyping(id, user.id, dto.typing, memberIds);
    return {
      message: CHAT_SUCCESS_MESSAGES.TYPING_UPDATED,
      data: { ok: true, conversationId: id, typing: dto.typing },
    };
  }

  @Post('conversations/:id/seen')
  @MarkSeenDocs()
  async markSeen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: MarkSeenDto = {},
  ) {
    const result = await this.proxy.sendChat<SeenResultView>(
      CHAT_PATTERNS.MARK_SEEN,
      {
        actorId: user.id,
        conversationId: id,
        messageId: dto.messageId,
      },
    );
    const { recipientIds, ...data } = result;
    await this.conversationCache.setMemberIds(id, recipientIds);
    this.chatGateway.broadcastSeen(data, recipientIds);
    return { message: CHAT_SUCCESS_MESSAGES.SEEN_UPDATED, data };
  }

  @Post('conversations/:id/members')
  @AddMembersDocs()
  async addMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: AddMembersDto,
  ) {
    await this.assertUsersExist(dto.memberIds);
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.ADD_MEMBERS,
      {
        actorId: user.id,
        conversationId: id,
        memberIds: dto.memberIds,
      },
    );
    await this.presence.attachToConversations([data]);
    await this.conversationCache.invalidate(id);
    return { message: CHAT_SUCCESS_MESSAGES.MEMBERS_ADDED, data };
  }

  @Delete('conversations/:id/members/:userId')
  @RemoveMemberDocs()
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Param('userId', ParseUuidPipe) userId: string,
  ) {
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.REMOVE_MEMBER,
      { actorId: user.id, conversationId: id, memberId: userId },
    );
    await this.presence.attachToConversations([data]);
    await this.conversationCache.invalidate(id);
    return { message: CHAT_SUCCESS_MESSAGES.MEMBER_REMOVED, data };
  }

  @Post('conversations/:id/leave')
  @LeaveConversationDocs()
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    const data = await this.proxy.sendChat(CHAT_PATTERNS.LEAVE, {
      actorId: user.id,
      conversationId: id,
    });
    await this.conversationCache.invalidate(id);
    return { message: CHAT_SUCCESS_MESSAGES.LEFT, data };
  }

  @Patch('conversations/:id')
  @UpdateGroupDocs()
  async updateGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const data = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.UPDATE_GROUP,
      {
        actorId: user.id,
        conversationId: id,
        name: dto.name,
      },
    );
    await this.presence.attachToConversations([data]);
    return { message: CHAT_SUCCESS_MESSAGES.GROUP_UPDATED, data };
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @DeleteGroupDocs()
  async deleteGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    const data = await this.proxy.sendChat<{
      deleted: boolean;
      recipientIds: string[];
    }>(CHAT_PATTERNS.DELETE_GROUP, {
      actorId: user.id,
      conversationId: id,
    });
    await this.conversationCache.invalidate(id);
    this.chatGateway.broadcastGroupDeleted(id, data.recipientIds);
    const { recipientIds: _recipientIds, ...result } = data;
    return { message: CHAT_SUCCESS_MESSAGES.GROUP_DELETED, data: result };
  }

  private async assertUserExists(userId: string): Promise<void> {
    try {
      await this.proxy.sendUser(USER_PATTERNS.FIND_BY_USER_ID, { userId });
    } catch {
      throw new NotFoundAppException('User');
    }
  }

  private async assertUsersExist(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map((userId) => this.assertUserExists(userId)));
  }
}
