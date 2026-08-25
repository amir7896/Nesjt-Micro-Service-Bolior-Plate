import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  PresenceStatus,
  RpcErrors,
  buildPaginatedResult,
  getSkipTake,
} from '@app/common';
import type {
  AddMembersPayload,
  ConversationActorPayload,
  ConversationView,
  CreateGroupChatPayload,
  CreatePrivateChatPayload,
  ListConversationsPayload,
  ListMessagesPayload,
  MarkSeenPayload,
  MessageView,
  RemoveMemberPayload,
  SeenResultView,
  SendMessagePayload,
  SendMessageResult,
  UpdateGroupPayload,
} from '@app/contracts';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationMember } from '../database/entities/conversation-member.entity';
import { Message } from '../database/entities/message.entity';

const MAX_GROUP_MEMBERS = 50;

export function privatePairKey(userA: string, userB: string): string {
  return [userA, userB].sort().join(':');
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly members: Repository<ConversationMember>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
  ) {}

  async createPrivate(
    payload: CreatePrivateChatPayload,
  ): Promise<ConversationView> {
    if (payload.actorId === payload.otherUserId) {
      return RpcErrors.badRequest(
        'You cannot start a private chat with yourself',
      );
    }

    const pairKey = privatePairKey(payload.actorId, payload.otherUserId);
    const existing = await this.conversations.findOne({
      where: { pairKey, type: ConversationType.PRIVATE },
      relations: { members: true },
    });
    if (existing) {
      return this.toConversationView(
        existing,
        payload.actorId,
        await this.unreadCountFor(payload.actorId, existing.id),
      );
    }

    const saved = await this.conversations.manager.transaction(
      async (manager) => {
        const conversation = await manager.save(
          manager.create(Conversation, {
            type: ConversationType.PRIVATE,
            name: null,
            createdBy: payload.actorId,
            pairKey,
          }),
        );
        await manager.save([
          manager.create(ConversationMember, {
            conversationId: conversation.id,
            userId: payload.actorId,
            role: ConversationMemberRole.MEMBER,
          }),
          manager.create(ConversationMember, {
            conversationId: conversation.id,
            userId: payload.otherUserId,
            role: ConversationMemberRole.MEMBER,
          }),
        ]);
        return manager.findOneOrFail(Conversation, {
          where: { id: conversation.id },
          relations: { members: true },
        });
      },
    );

    return this.toConversationView(saved, payload.actorId);
  }

  async createGroup(
    payload: CreateGroupChatPayload,
  ): Promise<ConversationView> {
    const name = payload.name.trim();
    if (!name) {
      return RpcErrors.badRequest('Group name is required');
    }

    const uniqueMemberIds = [
      ...new Set(payload.memberIds.filter((id) => id !== payload.actorId)),
    ];
    if (uniqueMemberIds.length < 1) {
      return RpcErrors.badRequest('A group needs at least one other member');
    }
    if (uniqueMemberIds.length + 1 > MAX_GROUP_MEMBERS) {
      return RpcErrors.badRequest(
        `A group cannot have more than ${MAX_GROUP_MEMBERS} members`,
      );
    }

    const saved = await this.conversations.manager.transaction(
      async (manager) => {
        const conversation = await manager.save(
          manager.create(Conversation, {
            type: ConversationType.GROUP,
            name,
            createdBy: payload.actorId,
            pairKey: null,
          }),
        );
        await manager.save([
          manager.create(ConversationMember, {
            conversationId: conversation.id,
            userId: payload.actorId,
            role: ConversationMemberRole.OWNER,
          }),
          ...uniqueMemberIds.map((userId) =>
            manager.create(ConversationMember, {
              conversationId: conversation.id,
              userId,
              role: ConversationMemberRole.MEMBER,
            }),
          ),
        ]);
        return manager.findOneOrFail(Conversation, {
          where: { id: conversation.id },
          relations: { members: true },
        });
      },
    );

    return this.toConversationView(saved, payload.actorId);
  }

  async listConversations(payload: ListConversationsPayload) {
    const memberships = await this.members.find({
      where: { userId: payload.actorId, leftAt: IsNull() },
      select: { conversationId: true },
    });
    const conversationIds = memberships.map((item) => item.conversationId);
    if (conversationIds.length === 0) {
      return buildPaginatedResult([], 0, payload.page, payload.limit);
    }

    const { skip, take } = getSkipTake(payload.page, payload.limit);
    const [items, total] = await this.conversations.findAndCount({
      where: { id: In(conversationIds) },
      relations: { members: true },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      skip,
      take,
    });
    const unread = await this.unreadCounts(
      payload.actorId,
      items.map((item) => item.id),
    );
    return buildPaginatedResult(
      items.map((item) =>
        this.toConversationView(
          item,
          payload.actorId,
          unread.get(item.id) ?? 0,
        ),
      ),
      total,
      payload.page,
      payload.limit,
    );
  }

  async getConversation(
    payload: ConversationActorPayload,
  ): Promise<ConversationView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    return this.toConversationView(
      conversation,
      payload.actorId,
      await this.unreadCountFor(payload.actorId, conversation.id),
    );
  }

  async listMessages(payload: ListMessagesPayload) {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const { skip, take } = getSkipTake(payload.page, payload.limit);
    const [items, total] = await this.messages.findAndCount({
      where: { conversationId: payload.conversationId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return buildPaginatedResult(
      items.map((item) => this.toMessageView(item, conversation.members)),
      total,
      payload.page,
      payload.limit,
    );
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const body = payload.body.trim();
    if (!body) {
      return RpcErrors.badRequest('Message body is required');
    }
    const type = payload.type ?? MessageType.TEXT;
    if (!Object.values(MessageType).includes(type)) {
      return RpcErrors.badRequest('Unsupported message type');
    }

    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const saved = await this.messages.save(
      this.messages.create({
        conversationId: conversation.id,
        senderId: payload.actorId,
        body,
        type,
      }),
    );
    conversation.lastMessageAt = saved.createdAt;
    await this.conversations.save(conversation);
    return {
      ...this.toMessageView(saved, conversation.members),
      recipientIds: this.recipientIds(conversation),
    };
  }

  async markSeen(payload: MarkSeenPayload): Promise<SeenResultView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const membership = conversation.members.find(
      (member) => member.userId === payload.actorId && !member.leftAt,
    );
    if (!membership) {
      return RpcErrors.notFound('Membership');
    }

    let messageId: string | null = null;
    let nextReadAt = new Date();
    if (payload.messageId) {
      const message = await this.messages.findOne({
        where: {
          id: payload.messageId,
          conversationId: conversation.id,
        },
      });
      if (!message) {
        return RpcErrors.notFound('Message');
      }
      messageId = message.id;
      nextReadAt = message.createdAt;
    }

    if (!membership.lastReadAt || nextReadAt > membership.lastReadAt) {
      membership.lastReadAt = nextReadAt;
      await this.members.save(membership);
    }

    return {
      conversationId: conversation.id,
      userId: payload.actorId,
      lastReadAt: membership.lastReadAt.toISOString(),
      messageId,
      recipientIds: this.recipientIds(conversation),
    };
  }

  async addMembers(payload: AddMembersPayload): Promise<ConversationView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    this.assertGroupAdmin(conversation, payload.actorId);

    const uniqueIds = [
      ...new Set(payload.memberIds.filter((id) => id !== payload.actorId)),
    ];
    if (uniqueIds.length === 0) {
      return RpcErrors.badRequest('At least one member id is required');
    }

    const activeCount = conversation.members.filter(
      (member) => !member.leftAt,
    ).length;
    if (activeCount + uniqueIds.length > MAX_GROUP_MEMBERS) {
      return RpcErrors.badRequest(
        `A group cannot have more than ${MAX_GROUP_MEMBERS} members`,
      );
    }

    for (const userId of uniqueIds) {
      const existing = conversation.members.find(
        (member) => member.userId === userId,
      );
      if (existing && !existing.leftAt) {
        continue;
      }
      if (existing?.leftAt) {
        existing.leftAt = null;
        existing.role = ConversationMemberRole.MEMBER;
        await this.members.save(existing);
        continue;
      }
      await this.members.save(
        this.members.create({
          conversationId: conversation.id,
          userId,
          role: ConversationMemberRole.MEMBER,
        }),
      );
    }

    return this.getConversation(payload);
  }

  async removeMember(payload: RemoveMemberPayload): Promise<ConversationView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    this.assertGroupAdmin(conversation, payload.actorId);

    if (payload.memberId === payload.actorId) {
      return RpcErrors.badRequest('Use leave to exit a group yourself');
    }

    const target = conversation.members.find(
      (member) => member.userId === payload.memberId && !member.leftAt,
    );
    if (!target) {
      return RpcErrors.notFound('Member');
    }
    if (target.role === ConversationMemberRole.OWNER) {
      return RpcErrors.forbidden('The group owner cannot be removed');
    }

    target.leftAt = new Date();
    await this.members.save(target);
    return this.getConversation(payload);
  }

  async leave(payload: ConversationActorPayload): Promise<{ left: boolean }> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    if (conversation.type === ConversationType.PRIVATE) {
      return RpcErrors.badRequest(
        'Private chats cannot be left. Delete is not supported.',
      );
    }

    const membership = conversation.members.find(
      (member) => member.userId === payload.actorId && !member.leftAt,
    );
    if (!membership) {
      return RpcErrors.notFound('Membership');
    }
    if (membership.role === ConversationMemberRole.OWNER) {
      const otherAdmins = conversation.members.filter(
        (member) =>
          !member.leftAt &&
          member.userId !== payload.actorId &&
          (member.role === ConversationMemberRole.OWNER ||
            member.role === ConversationMemberRole.ADMIN),
      );
      if (otherAdmins.length === 0) {
        return RpcErrors.forbidden(
          'Transfer ownership or appoint an admin before leaving this group',
        );
      }
    }

    membership.leftAt = new Date();
    await this.members.save(membership);
    return { left: true };
  }

  async updateGroup(payload: UpdateGroupPayload): Promise<ConversationView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    this.assertGroupAdmin(conversation, payload.actorId);
    const name = payload.name.trim();
    if (!name) {
      return RpcErrors.badRequest('Group name is required');
    }
    conversation.name = name;
    await this.conversations.save(conversation);
    return this.getConversation(payload);
  }

  private async requireMembership(
    conversationId: string,
    actorId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversations.findOne({
      where: { id: conversationId },
      relations: { members: true },
    });
    if (!conversation) {
      return RpcErrors.notFound('Conversation');
    }
    const membership = conversation.members.find(
      (member) => member.userId === actorId && !member.leftAt,
    );
    if (!membership) {
      return RpcErrors.forbidden('You are not a member of this conversation');
    }
    conversation.members = conversation.members.filter(
      (member) => !member.leftAt,
    );
    return conversation;
  }

  private assertGroupAdmin(conversation: Conversation, actorId: string): void {
    if (conversation.type !== ConversationType.GROUP) {
      return RpcErrors.badRequest(
        'Only group conversations support this action',
      );
    }
    const membership = conversation.members.find(
      (member) => member.userId === actorId,
    );
    if (
      !membership ||
      (membership.role !== ConversationMemberRole.OWNER &&
        membership.role !== ConversationMemberRole.ADMIN)
    ) {
      return RpcErrors.forbidden(
        'Only group owners or admins can manage members',
      );
    }
  }

  private async unreadCountFor(
    actorId: string,
    conversationId: string,
  ): Promise<number> {
    const counts = await this.unreadCounts(actorId, [conversationId]);
    return counts.get(conversationId) ?? 0;
  }

  private async unreadCounts(
    actorId: string,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (conversationIds.length === 0) {
      return counts;
    }

    const rows = await this.messages
      .createQueryBuilder('m')
      .select('m.conversationId', 'conversationId')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(
        ConversationMember,
        'cm',
        'cm.conversationId = m.conversationId AND cm.userId = :actorId AND cm.leftAt IS NULL',
        { actorId },
      )
      .where('m.conversationId IN (:...conversationIds)', { conversationIds })
      .andWhere('m.senderId != :actorId', { actorId })
      .andWhere('(cm.lastReadAt IS NULL OR m.createdAt > cm.lastReadAt)')
      .groupBy('m.conversationId')
      .getRawMany<{ conversationId: string; count: string }>();

    for (const row of rows) {
      counts.set(row.conversationId, Number(row.count));
    }
    return counts;
  }

  private recipientIds(conversation: Conversation): string[] {
    return (conversation.members ?? [])
      .filter((member) => !member.leftAt)
      .map((member) => member.userId);
  }

  private toConversationView(
    conversation: Conversation,
    actorId: string,
    unreadCount = 0,
  ): ConversationView {
    const activeMembers = (conversation.members ?? []).filter(
      (member) => !member.leftAt,
    );
    const actor = activeMembers.find((member) => member.userId === actorId);
    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      createdBy: conversation.createdBy,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      lastMessage: null,
      lastReadAt: actor?.lastReadAt?.toISOString() ?? null,
      unreadCount,
      members: activeMembers.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        lastReadAt: member.lastReadAt?.toISOString() ?? null,
        status: PresenceStatus.OFFLINE,
        lastSeenAt: null,
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private toMessageView(
    message: Message,
    members: ConversationMember[] = [],
  ): MessageView {
    const seenBy = members
      .filter(
        (member) =>
          !member.leftAt &&
          member.userId !== message.senderId &&
          member.lastReadAt != null &&
          member.lastReadAt >= message.createdAt,
      )
      .map((member) => member.userId);
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      type: message.type ?? MessageType.TEXT,
      seenBy,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
