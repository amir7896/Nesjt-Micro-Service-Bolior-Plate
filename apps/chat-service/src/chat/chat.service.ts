import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  ALLOWED_REACTIONS,
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
  BlockUserPayload,
  BlockView,
  ConversationActorPayload,
  ConversationView,
  CreateGroupChatPayload,
  CreatePrivateChatPayload,
  DeleteMessagePayload,
  DeleteMessageResult,
  EditMessagePayload,
  ForwardMessagePayload,
  ListConversationsPayload,
  ListMessagesPayload,
  MarkSeenPayload,
  MessageReactionView,
  MessageReplyView,
  MessageView,
  MuteConversationPayload,
  PinConversationPayload,
  ReactMessagePayload,
  RemoveMemberPayload,
  SearchMessagesPayload,
  SeenResultView,
  SendMessagePayload,
  SendMessageResult,
  SetMemberRolePayload,
  UpdateGroupPayload,
} from '@app/contracts';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationMember } from '../database/entities/conversation-member.entity';
import { Message } from '../database/entities/message.entity';
import { MessageHide } from '../database/entities/message-hide.entity';
import { MessageReaction } from '../database/entities/message-reaction.entity';
import { UserBlock } from '../database/entities/user-block.entity';

const MAX_GROUP_MEMBERS = 50;
const DELETE_FOR_EVERYONE_WINDOW_MS = 60 * 60 * 1000;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
    @InjectRepository(MessageHide)
    private readonly messageHides: Repository<MessageHide>,
    @InjectRepository(MessageReaction)
    private readonly messageReactions: Repository<MessageReaction>,
    @InjectRepository(UserBlock)
    private readonly userBlocks: Repository<UserBlock>,
  ) {}

  async createPrivate(
    payload: CreatePrivateChatPayload,
  ): Promise<ConversationView> {
    if (payload.actorId === payload.otherUserId) {
      return RpcErrors.badRequest(
        'You cannot start a private chat with yourself',
      );
    }

    if (await this.isBlockedEitherWay(payload.actorId, payload.otherUserId)) {
      return RpcErrors.forbidden('You cannot start a chat with this user');
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
      select: { conversationId: true, pinnedAt: true },
    });
    const conversationIds = memberships.map((item) => item.conversationId);
    if (conversationIds.length === 0) {
      return buildPaginatedResult([], 0, payload.page, payload.limit);
    }

    const pinnedAtByConversation = new Map(
      memberships.map((item) => [item.conversationId, item.pinnedAt] as const),
    );

    const items = await this.conversations.find({
      where: { id: In(conversationIds) },
      relations: { members: true },
    });

    items.sort((a, b) => {
      const aPinned = pinnedAtByConversation.get(a.id) != null ? 1 : 0;
      const bPinned = pinnedAtByConversation.get(b.id) != null ? 1 : 0;
      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }
      const aTime = a.lastMessageAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });

    const total = items.length;
    const { skip, take } = getSkipTake(payload.page, payload.limit);
    const pageItems = items.slice(skip, skip + take);
    const unread = await this.unreadCounts(
      payload.actorId,
      pageItems.map((item) => item.id),
    );
    const latest = await this.latestMessagesByConversation(
      pageItems.map((item) => item.id),
    );
    return buildPaginatedResult(
      pageItems.map((item) =>
        this.toConversationView(
          item,
          payload.actorId,
          unread.get(item.id) ?? 0,
          latest.get(item.id) ?? null,
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
    const [items, total] = await this.messages
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', {
        conversationId: payload.conversationId,
      })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM message_hides mh
          WHERE mh."messageId" = m.id AND mh."userId" = :actorId
        )`,
        { actorId: payload.actorId },
      )
      .orderBy('m.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const replyMap = await this.loadReplyParents(items);
    const reactionsByMessage = await this.loadReactionsByMessageIds(
      items.map((item) => item.id),
    );
    return buildPaginatedResult(
      items.map((item) =>
        this.toMessageView(
          item,
          conversation.members,
          replyMap.get(item.replyToMessageId ?? '') ?? null,
          reactionsByMessage.get(item.id) ?? [],
          payload.actorId,
        ),
      ),
      total,
      payload.page,
      payload.limit,
    );
  }

  async searchMessages(payload: SearchMessagesPayload) {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const query = payload.query.trim();
    if (!query) {
      return RpcErrors.badRequest('Search query is required');
    }

    const { skip, take } = getSkipTake(payload.page, payload.limit);
    const [items, total] = await this.messages
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', {
        conversationId: payload.conversationId,
      })
      .andWhere('m.body ILIKE :pattern', { pattern: `%${query}%` })
      .andWhere('m.deletedForEveryoneAt IS NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM message_hides mh
          WHERE mh."messageId" = m.id AND mh."userId" = :actorId
        )`,
        { actorId: payload.actorId },
      )
      .orderBy('m.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const replyMap = await this.loadReplyParents(items);
    const reactionsByMessage = await this.loadReactionsByMessageIds(
      items.map((item) => item.id),
    );
    return buildPaginatedResult(
      items.map((item) =>
        this.toMessageView(
          item,
          conversation.members,
          replyMap.get(item.replyToMessageId ?? '') ?? null,
          reactionsByMessage.get(item.id) ?? [],
          payload.actorId,
        ),
      ),
      total,
      payload.page,
      payload.limit,
    );
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const attachmentUrl = payload.attachmentUrl?.trim() || null;
    const rawBody = (payload.body ?? '').trim();
    if (!rawBody && !attachmentUrl) {
      return RpcErrors.badRequest('Message body or attachment is required');
    }

    let type = payload.type ?? MessageType.TEXT;
    if (!Object.values(MessageType).includes(type)) {
      return RpcErrors.badRequest('Unsupported message type');
    }

    const attachmentMime = payload.attachmentMime?.trim() || null;
    if (attachmentUrl) {
      type = attachmentMime?.startsWith('image/')
        ? MessageType.IMAGE
        : MessageType.FILE;
    }

    const body =
      rawBody ||
      (type === MessageType.IMAGE
        ? '[Image]'
        : type === MessageType.FILE
          ? '[File]'
          : '');

    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );

    if (conversation.type === ConversationType.PRIVATE) {
      const other = conversation.members.find(
        (member) => member.userId !== payload.actorId,
      );
      if (
        other &&
        (await this.isBlockedEitherWay(payload.actorId, other.userId))
      ) {
        return RpcErrors.forbidden('You cannot message this user');
      }
    }

    let replyTo: Message | null = null;
    if (payload.replyToMessageId) {
      replyTo = await this.messages.findOne({
        where: {
          id: payload.replyToMessageId,
          conversationId: conversation.id,
        },
      });
      if (!replyTo) {
        return RpcErrors.badRequest(
          'Reply target must be a message in this conversation',
        );
      }
      if (replyTo.deletedForEveryoneAt) {
        return RpcErrors.badRequest(
          'Cannot reply to a message deleted for everyone',
        );
      }
    }

    const saved = await this.messages.save(
      this.messages.create({
        conversationId: conversation.id,
        senderId: payload.actorId,
        body,
        type,
        replyToMessageId: replyTo?.id ?? null,
        attachmentUrl,
        attachmentMime,
        attachmentName: payload.attachmentName?.trim() || null,
        attachmentSize: payload.attachmentSize ?? null,
      }),
    );
    conversation.lastMessageAt = saved.createdAt;
    await this.conversations.save(conversation);
    return {
      ...this.toMessageView(saved, conversation.members, replyTo, [], payload.actorId),
      recipientIds: this.recipientIds(conversation),
    };
  }

  async editMessage(payload: EditMessagePayload): Promise<SendMessageResult> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const message = await this.messages.findOne({
      where: {
        id: payload.messageId,
        conversationId: conversation.id,
      },
    });
    if (!message) {
      return RpcErrors.notFound('Message');
    }
    if (message.senderId !== payload.actorId) {
      return RpcErrors.forbidden('Only the sender can edit this message');
    }
    if (message.deletedForEveryoneAt) {
      return RpcErrors.badRequest('Cannot edit a deleted message');
    }
    const ageMs = Date.now() - message.createdAt.getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      return RpcErrors.badRequest(
        'Messages can only be edited within 15 minutes',
      );
    }

    const body = payload.body.trim();
    if (!body) {
      return RpcErrors.badRequest('Message body is required');
    }

    message.body = body;
    message.editedAt = new Date();
    await this.messages.save(message);

    const replyTo = message.replyToMessageId
      ? await this.messages.findOne({ where: { id: message.replyToMessageId } })
      : null;
    const reactions = await this.messageReactions.find({
      where: { messageId: message.id },
    });

    return {
      ...this.toMessageView(
        message,
        conversation.members,
        replyTo,
        reactions,
        payload.actorId,
      ),
      recipientIds: this.recipientIds(conversation),
    };
  }

  async reactMessage(payload: ReactMessagePayload): Promise<SendMessageResult> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    if (!(ALLOWED_REACTIONS as readonly string[]).includes(payload.emoji)) {
      return RpcErrors.badRequest('Unsupported reaction');
    }

    const message = await this.messages.findOne({
      where: {
        id: payload.messageId,
        conversationId: conversation.id,
      },
    });
    if (!message) {
      return RpcErrors.notFound('Message');
    }
    if (message.deletedForEveryoneAt) {
      return RpcErrors.badRequest('Cannot react to a deleted message');
    }

    const existing = await this.messageReactions.findOne({
      where: {
        messageId: message.id,
        userId: payload.actorId,
        emoji: payload.emoji,
      },
    });
    if (existing) {
      await this.messageReactions.remove(existing);
    } else {
      await this.messageReactions.save(
        this.messageReactions.create({
          messageId: message.id,
          userId: payload.actorId,
          emoji: payload.emoji,
        }),
      );
    }

    const replyTo = message.replyToMessageId
      ? await this.messages.findOne({ where: { id: message.replyToMessageId } })
      : null;
    const reactions = await this.messageReactions.find({
      where: { messageId: message.id },
    });

    return {
      ...this.toMessageView(
        message,
        conversation.members,
        replyTo,
        reactions,
        payload.actorId,
      ),
      recipientIds: this.recipientIds(conversation),
    };
  }

  async forwardMessage(
    payload: ForwardMessagePayload,
  ): Promise<SendMessageResult> {
    const fromConversation = await this.requireMembership(
      payload.fromConversationId,
      payload.actorId,
    );
    const toConversation = await this.requireMembership(
      payload.toConversationId,
      payload.actorId,
    );

    const source = await this.messages.findOne({
      where: {
        id: payload.messageId,
        conversationId: fromConversation.id,
      },
    });
    if (!source || source.deletedForEveryoneAt) {
      return RpcErrors.notFound('Message');
    }

    if (toConversation.type === ConversationType.PRIVATE) {
      const other = toConversation.members.find(
        (member) => member.userId !== payload.actorId,
      );
      if (
        other &&
        (await this.isBlockedEitherWay(payload.actorId, other.userId))
      ) {
        return RpcErrors.forbidden('You cannot message this user');
      }
    }

    const saved = await this.messages.save(
      this.messages.create({
        conversationId: toConversation.id,
        senderId: payload.actorId,
        body: source.body,
        type: source.type,
        attachmentUrl: source.attachmentUrl,
        attachmentMime: source.attachmentMime,
        attachmentName: source.attachmentName,
        attachmentSize: source.attachmentSize,
        forwardedFromMessageId: source.id,
      }),
    );
    toConversation.lastMessageAt = saved.createdAt;
    await this.conversations.save(toConversation);

    return {
      ...this.toMessageView(
        saved,
        toConversation.members,
        null,
        [],
        payload.actorId,
      ),
      recipientIds: this.recipientIds(toConversation),
    };
  }

  async pinConversation(
    payload: PinConversationPayload,
  ): Promise<ConversationView> {
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

    membership.pinnedAt = payload.pinned ? new Date() : null;
    await this.members.save(membership);
    return this.getConversation(payload);
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
    // Always advance the read cursor to "now" so every message already in the
    // thread is treated as read (WhatsApp-style while the chat is open).
    const nextReadAt = new Date();
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

  async muteConversation(
    payload: MuteConversationPayload,
  ): Promise<ConversationView> {
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

    membership.mutedAt = payload.muted ? new Date() : null;
    await this.members.save(membership);
    return this.getConversation(payload);
  }

  async deleteMessage(
    payload: DeleteMessagePayload,
  ): Promise<DeleteMessageResult> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    const message = await this.messages.findOne({
      where: {
        id: payload.messageId,
        conversationId: conversation.id,
      },
    });
    if (!message) {
      return RpcErrors.notFound('Message');
    }

    if (payload.forEveryone) {
      if (message.senderId !== payload.actorId) {
        return RpcErrors.forbidden(
          'Only the sender can delete a message for everyone',
        );
      }
      if (message.deletedForEveryoneAt) {
        const replyTo = message.replyToMessageId
          ? await this.messages.findOne({
              where: { id: message.replyToMessageId },
            })
          : null;
        const reactions = await this.messageReactions.find({
          where: { messageId: message.id },
        });
        return {
          message: this.toMessageView(
            message,
            conversation.members,
            replyTo,
            reactions,
            payload.actorId,
          ),
          forEveryone: true,
          recipientIds: this.recipientIds(conversation),
        };
      }
      const ageMs = Date.now() - message.createdAt.getTime();
      if (ageMs > DELETE_FOR_EVERYONE_WINDOW_MS) {
        return RpcErrors.badRequest(
          'Messages can only be deleted for everyone within 60 minutes',
        );
      }
      message.deletedForEveryoneAt = new Date();
      await this.messages.save(message);
      const replyTo = message.replyToMessageId
        ? await this.messages.findOne({
            where: { id: message.replyToMessageId },
          })
        : null;
      const reactions = await this.messageReactions.find({
        where: { messageId: message.id },
      });
      return {
        message: this.toMessageView(
          message,
          conversation.members,
          replyTo,
          reactions,
          payload.actorId,
        ),
        forEveryone: true,
        recipientIds: this.recipientIds(conversation),
      };
    }

    const existingHide = await this.messageHides.findOne({
      where: { messageId: message.id, userId: payload.actorId },
    });
    if (!existingHide) {
      await this.messageHides.save(
        this.messageHides.create({
          messageId: message.id,
          userId: payload.actorId,
        }),
      );
    }

    const replyTo = message.replyToMessageId
      ? await this.messages.findOne({
          where: { id: message.replyToMessageId },
        })
      : null;
    const reactions = await this.messageReactions.find({
      where: { messageId: message.id },
    });
    return {
      message: this.toMessageView(
        message,
        conversation.members,
        replyTo,
        reactions,
        payload.actorId,
      ),
      forEveryone: false,
      recipientIds: [payload.actorId],
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

  async setMemberRole(
    payload: SetMemberRolePayload,
  ): Promise<ConversationView> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    if (conversation.type !== ConversationType.GROUP) {
      return RpcErrors.badRequest(
        'Only group conversations support this action',
      );
    }

    const actor = conversation.members.find(
      (member) => member.userId === payload.actorId && !member.leftAt,
    );
    if (!actor || actor.role !== ConversationMemberRole.OWNER) {
      return RpcErrors.forbidden('Only the group owner can change member roles');
    }

    if (
      payload.role !== ConversationMemberRole.ADMIN &&
      payload.role !== ConversationMemberRole.MEMBER
    ) {
      return RpcErrors.badRequest('Role must be ADMIN or MEMBER');
    }

    const target = conversation.members.find(
      (member) => member.userId === payload.memberId && !member.leftAt,
    );
    if (!target) {
      return RpcErrors.notFound('Member');
    }
    if (target.role === ConversationMemberRole.OWNER) {
      return RpcErrors.forbidden('The group owner role cannot be changed');
    }
    if (target.userId === payload.actorId) {
      return RpcErrors.badRequest('Cannot change your own role');
    }

    target.role = payload.role;
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
      const remaining = conversation.members
        .filter((member) => !member.leftAt && member.userId !== payload.actorId)
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      if (remaining[0]) {
        remaining[0].role = ConversationMemberRole.OWNER;
        await this.members.save(remaining[0]);
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

  async deleteGroup(
    payload: ConversationActorPayload,
  ): Promise<{ deleted: boolean; recipientIds: string[] }> {
    const conversation = await this.requireMembership(
      payload.conversationId,
      payload.actorId,
    );
    if (conversation.type !== ConversationType.GROUP) {
      return RpcErrors.badRequest('Only group chats can be deleted');
    }
    if (conversation.createdBy !== payload.actorId) {
      return RpcErrors.forbidden('Only the group creator can delete this group');
    }

    const recipientIds = conversation.members.map((member) => member.userId);
    const now = new Date();
    for (const member of conversation.members) {
      if (!member.leftAt) {
        member.leftAt = now;
      }
    }
    await this.members.save(conversation.members);
    await this.conversations.softDelete({ id: conversation.id });
    return { deleted: true, recipientIds };
  }

  async blockUser(payload: BlockUserPayload): Promise<BlockView> {
    if (payload.actorId === payload.userId) {
      return RpcErrors.badRequest('You cannot block yourself');
    }

    let block = await this.userBlocks.findOne({
      where: { blockerId: payload.actorId, blockedId: payload.userId },
    });
    if (!block) {
      block = await this.userBlocks.save(
        this.userBlocks.create({
          blockerId: payload.actorId,
          blockedId: payload.userId,
        }),
      );
    }

    return {
      userId: block.blockedId,
      createdAt: block.createdAt.toISOString(),
    };
  }

  async unblockUser(payload: BlockUserPayload): Promise<{ unblocked: boolean }> {
    const result = await this.userBlocks.delete({
      blockerId: payload.actorId,
      blockedId: payload.userId,
    });
    return { unblocked: (result.affected ?? 0) > 0 };
  }

  async listBlocks(payload: { actorId: string }): Promise<BlockView[]> {
    const blocks = await this.userBlocks.find({
      where: { blockerId: payload.actorId },
      order: { createdAt: 'DESC' },
    });
    return blocks.map((block) => ({
      userId: block.blockedId,
      createdAt: block.createdAt.toISOString(),
    }));
  }

  private async isBlockedEitherWay(
    userA: string,
    userB: string,
  ): Promise<boolean> {
    const count = await this.userBlocks.count({
      where: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    });
    return count > 0;
  }

  private async loadReplyParents(
    messages: Message[],
  ): Promise<Map<string, Message>> {
    const ids = [
      ...new Set(
        messages
          .map((item) => item.replyToMessageId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const map = new Map<string, Message>();
    if (ids.length === 0) {
      return map;
    }
    const parents = await this.messages.find({ where: { id: In(ids) } });
    for (const parent of parents) {
      map.set(parent.id, parent);
    }
    return map;
  }

  private async loadReactionsByMessageIds(
    messageIds: string[],
  ): Promise<Map<string, MessageReaction[]>> {
    const map = new Map<string, MessageReaction[]>();
    if (messageIds.length === 0) {
      return map;
    }
    const reactions = await this.messageReactions.find({
      where: { messageId: In(messageIds) },
    });
    for (const reaction of reactions) {
      const list = map.get(reaction.messageId) ?? [];
      list.push(reaction);
      map.set(reaction.messageId, list);
    }
    return map;
  }

  private buildReactionViews(
    reactions: MessageReaction[],
    actorId?: string,
  ): MessageReactionView[] {
    const byEmoji = new Map<string, { count: number; reactedByMe: boolean }>();
    for (const reaction of reactions) {
      const current = byEmoji.get(reaction.emoji) ?? {
        count: 0,
        reactedByMe: false,
      };
      current.count += 1;
      if (actorId && reaction.userId === actorId) {
        current.reactedByMe = true;
      }
      byEmoji.set(reaction.emoji, current);
    }
    return [...byEmoji.entries()].map(([emoji, data]) => ({
      emoji,
      count: data.count,
      reactedByMe: data.reactedByMe,
    }));
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
      .andWhere('m.deletedForEveryoneAt IS NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM message_hides mh
          WHERE mh."messageId" = m.id AND mh."userId" = :actorId
        )`,
      )
      .groupBy('m.conversationId')
      .getRawMany<{ conversationId: string; count: string }>();

    for (const row of rows) {
      counts.set(row.conversationId, Number(row.count));
    }
    return counts;
  }

  private async latestMessagesByConversation(
    conversationIds: string[],
  ): Promise<Map<string, Message>> {
    const latest = new Map<string, Message>();
    if (conversationIds.length === 0) {
      return latest;
    }

    // Prefer a non-deleted-for-everyone preview when available; otherwise keep
    // the newest row so toMessageView can render a deleted placeholder.
    const rows = await this.messages
      .createQueryBuilder('m')
      .distinctOn(['m.conversationId'])
      .where('m.conversationId IN (:...conversationIds)', { conversationIds })
      .orderBy('m.conversationId')
      .addOrderBy('CASE WHEN m.deletedForEveryoneAt IS NULL THEN 0 ELSE 1 END')
      .addOrderBy('m.createdAt', 'DESC')
      .getMany();

    for (const row of rows) {
      latest.set(row.conversationId, row);
    }
    return latest;
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
    lastMessage: Message | null = null,
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
      lastMessage: lastMessage
        ? this.toMessageView(lastMessage, activeMembers, null, [], actorId)
        : null,
      lastReadAt: actor?.lastReadAt?.toISOString() ?? null,
      muted: Boolean(actor?.mutedAt),
      pinned: Boolean(actor?.pinnedAt),
      unreadCount,
      members: activeMembers.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        lastReadAt: member.lastReadAt?.toISOString() ?? null,
        muted: Boolean(member.mutedAt),
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
    replyTo: Message | null = null,
    reactions: MessageReaction[] = [],
    actorId?: string,
  ): MessageView {
    const deletedForEveryone = Boolean(message.deletedForEveryoneAt);
    const seenBy = members
      .filter(
        (member) =>
          !member.leftAt &&
          member.userId !== message.senderId &&
          member.lastReadAt != null &&
          member.lastReadAt >= message.createdAt,
      )
      .map((member) => member.userId);

    let replyToView: MessageReplyView | null = null;
    if (replyTo) {
      const replyDeleted = Boolean(replyTo.deletedForEveryoneAt);
      replyToView = {
        id: replyTo.id,
        senderId: replyTo.senderId,
        body: replyDeleted ? '' : replyTo.body,
        deletedForEveryone: replyDeleted,
      };
    }

    const hasAttachment = Boolean(message.attachmentUrl);

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: deletedForEveryone ? '' : message.body,
      type: message.type ?? MessageType.TEXT,
      replyTo: replyToView,
      attachment:
        !deletedForEveryone && hasAttachment && message.attachmentUrl
          ? {
              url: message.attachmentUrl,
              mime: message.attachmentMime ?? '',
              name: message.attachmentName ?? '',
              size: message.attachmentSize ?? 0,
            }
          : null,
      reactions: deletedForEveryone
        ? []
        : this.buildReactionViews(reactions, actorId),
      editedAt: message.editedAt?.toISOString() ?? null,
      forwarded: Boolean(message.forwardedFromMessageId),
      deletedForEveryone,
      seenBy,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
