import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  PresenceStatus,
} from '@app/common';

export const CHAT_PATTERNS = {
  CREATE_PRIVATE: 'chat.create_private',
  CREATE_GROUP: 'chat.create_group',
  LIST_CONVERSATIONS: 'chat.list_conversations',
  GET_CONVERSATION: 'chat.get_conversation',
  LIST_MESSAGES: 'chat.list_messages',
  SEND_MESSAGE: 'chat.send_message',
  MARK_SEEN: 'chat.mark_seen',
  ADD_MEMBERS: 'chat.add_members',
  REMOVE_MEMBER: 'chat.remove_member',
  LEAVE: 'chat.leave',
  UPDATE_GROUP: 'chat.update_group',
  DELETE_GROUP: 'chat.delete_group',
} as const;

export interface CreatePrivateChatPayload {
  actorId: string;
  otherUserId: string;
}

export interface CreateGroupChatPayload {
  actorId: string;
  name: string;
  memberIds: string[];
}

export interface ListConversationsPayload {
  actorId: string;
  page: number;
  limit: number;
}

export interface ConversationActorPayload {
  actorId: string;
  conversationId: string;
}

export interface ListMessagesPayload extends ConversationActorPayload {
  page: number;
  limit: number;
}

export interface SendMessagePayload extends ConversationActorPayload {
  body: string;
  type?: MessageType;
}

export interface SendMessageResult extends MessageView {
  recipientIds: string[];
}

export interface MarkSeenPayload extends ConversationActorPayload {
  messageId?: string;
}

export interface AddMembersPayload extends ConversationActorPayload {
  memberIds: string[];
}

export interface RemoveMemberPayload extends ConversationActorPayload {
  memberId: string;
}

export interface UpdateGroupPayload extends ConversationActorPayload {
  name: string;
}

export interface ConversationMemberView {
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string;
  lastReadAt: string | null;
  status: PresenceStatus;
  lastSeenAt: string | null;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: MessageType;
  seenBy: string[];
  createdAt: string;
}

export interface ConversationView {
  id: string;
  type: ConversationType;
  name: string | null;
  createdBy: string;
  lastMessageAt: string | null;
  lastMessage: MessageView | null;
  lastReadAt: string | null;
  unreadCount: number;
  members: ConversationMemberView[];
  createdAt: string;
  updatedAt: string;
}

export interface SeenResultView {
  conversationId: string;
  userId: string;
  lastReadAt: string;
  messageId: string | null;
  recipientIds: string[];
}

export interface PresenceView {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
}
