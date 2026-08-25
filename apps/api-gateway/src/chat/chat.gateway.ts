import { Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageType, PresenceStatus } from '@app/common';
import { CHAT_PATTERNS } from '@app/contracts';
import type {
  ConversationView,
  MessageView,
  SeenResultView,
  SendMessageResult,
} from '@app/contracts';
import { MicroserviceProxy } from '../infrastructure/proxy/microservice.proxy';
import { ConversationCacheService } from './conversation-cache.service';
import { PresenceService } from './presence.service';
import { WsAuthService } from './ws-auth.service';

type AuthedSocket = Socket & {
  data: { userId?: string; conversationIds?: string[] };
};

@SkipThrottle()
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly proxy: MicroserviceProxy,
    private readonly presence: PresenceService,
    private readonly conversationCache: ConversationCacheService,
  ) {}

  async handleConnection(client: AuthedSocket): Promise<void> {
    try {
      const user = await this.wsAuth.authenticate(client);
      client.data.userId = user.id;
      client.data.conversationIds = [];
      await client.join(`user:${user.id}`);
      const { becameOnline } = await this.presence.connect(user.id, client.id);
      if (becameOnline) {
        this.server.to(`user:${user.id}`).emit('chat:presence', {
          userId: user.id,
          status: PresenceStatus.ONLINE,
          lastSeenAt: null,
        });
      }
    } catch (error) {
      this.logger.debug(
        `Socket ${client.id} rejected: ${error instanceof Error ? error.message : 'unauthorized'}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthedSocket): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }
    const conversationIds = client.data.conversationIds ?? [];
    const result = await this.presence.disconnect(userId, client.id);
    if (result.status === PresenceStatus.OFFLINE) {
      this.broadcastPresence(
        userId,
        PresenceStatus.OFFLINE,
        result.lastSeenAt,
        conversationIds,
      );
    }
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('chat:join')
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const userId = this.requireUser(client);
    const conversationId = this.requireConversationId(body);
    const conversation = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.GET_CONVERSATION,
      {
        actorId: userId,
        conversationId,
      },
    );
    const memberIds = conversation.members.map((member) => member.userId);
    await this.conversationCache.setMemberIds(conversationId, memberIds);
    await client.join(`conversation:${conversationId}`);
    client.data.conversationIds = [
      ...new Set([...(client.data.conversationIds ?? []), conversationId]),
    ];
    this.emitToMembers(
      'chat:presence',
      {
        userId,
        status: PresenceStatus.ONLINE,
        lastSeenAt: null,
        conversationId,
      },
      conversationId,
      memberIds,
    );
    return { joined: conversationId };
  }

  @SubscribeMessage('chat:message')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: { conversationId?: string; body?: string; type?: MessageType },
  ) {
    const userId = this.requireUser(client);
    const conversationId = this.requireConversationId(body);
    const text = body.body?.trim();
    if (!text) {
      throw new WsException('Message body is required');
    }

    const result = await this.proxy.sendChat<SendMessageResult>(
      CHAT_PATTERNS.SEND_MESSAGE,
      {
        actorId: userId,
        conversationId,
        body: text,
        type: body.type ?? MessageType.TEXT,
      },
    );
    const { recipientIds, ...message } = result;
    await this.conversationCache.setMemberIds(conversationId, recipientIds);
    this.broadcastMessage(message, recipientIds);
    return message;
  }

  @SubscribeMessage('chat:typing')
  async typing(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId?: string; typing?: boolean },
  ) {
    const userId = this.requireUser(client);
    const conversationId = this.requireConversationId(body);
    const memberIds = await this.memberIdsFor(userId, conversationId);
    this.broadcastTyping(
      conversationId,
      userId,
      body.typing !== false,
      memberIds,
    );
    return { ok: true };
  }

  @SubscribeMessage('chat:seen')
  async markSeen(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId?: string; messageId?: string },
  ) {
    const userId = this.requireUser(client);
    const conversationId = this.requireConversationId(body);
    const result = await this.proxy.sendChat<SeenResultView>(
      CHAT_PATTERNS.MARK_SEEN,
      {
        actorId: userId,
        conversationId,
        messageId: body.messageId,
      },
    );
    const { recipientIds, ...seen } = result;
    await this.conversationCache.setMemberIds(conversationId, recipientIds);
    this.broadcastSeen(seen, recipientIds);
    return seen;
  }

  @SubscribeMessage('chat:heartbeat')
  async heartbeat(@ConnectedSocket() client: AuthedSocket) {
    const userId = this.requireUser(client);
    await this.presence.heartbeat(userId);
    return { ok: true, status: PresenceStatus.ONLINE };
  }

  broadcastMessage(message: MessageView, recipientIds: string[] = []): void {
    this.emitToMembers(
      'chat:message',
      message,
      message.conversationId,
      recipientIds,
    );
  }

  broadcastTyping(
    conversationId: string,
    userId: string,
    typing: boolean,
    recipientIds: string[] = [],
  ): void {
    this.emitToMembers(
      'chat:typing',
      { conversationId, userId, typing },
      conversationId,
      recipientIds,
    );
  }

  broadcastSeen(
    result: Omit<SeenResultView, 'recipientIds'>,
    recipientIds: string[] = [],
  ): void {
    this.emitToMembers(
      'chat:seen',
      result,
      result.conversationId,
      recipientIds,
    );
  }

  broadcastPresence(
    userId: string,
    status: PresenceStatus,
    lastSeenAt: string | null,
    conversationIds: string[],
  ): void {
    for (const conversationId of conversationIds) {
      this.server?.to(`conversation:${conversationId}`).emit('chat:presence', {
        userId,
        status,
        lastSeenAt,
        conversationId,
      });
    }
  }

  private emitToMembers(
    event: string,
    payload: unknown,
    conversationId: string,
    recipientIds: string[],
  ): void {
    if (!this.server) {
      return;
    }
    const rooms = [
      `conversation:${conversationId}`,
      ...recipientIds.map((id) => `user:${id}`),
    ];
    this.server.to(rooms).emit(event, payload);
  }

  private async memberIdsFor(
    actorId: string,
    conversationId: string,
  ): Promise<string[]> {
    const cached = await this.conversationCache.getMemberIds(conversationId);
    if (cached) {
      return cached;
    }
    const conversation = await this.proxy.sendChat<ConversationView>(
      CHAT_PATTERNS.GET_CONVERSATION,
      { actorId, conversationId },
    );
    const memberIds = conversation.members.map((member) => member.userId);
    await this.conversationCache.setMemberIds(conversationId, memberIds);
    return memberIds;
  }

  private requireUser(client: AuthedSocket): string {
    if (!client.data.userId) {
      throw new WsException('Authentication is required');
    }
    return client.data.userId;
  }

  private requireConversationId(body: { conversationId?: string }): string {
    if (!body?.conversationId) {
      throw new WsException('conversationId is required');
    }
    return body.conversationId;
  }
}
