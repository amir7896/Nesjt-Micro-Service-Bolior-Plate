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
  SEARCH_MESSAGES: 'chat.search_messages',
  SEND_MESSAGE: 'chat.send_message',
  EDIT_MESSAGE: 'chat.edit_message',
  REACT_MESSAGE: 'chat.react_message',
  FORWARD_MESSAGE: 'chat.forward_message',
  MARK_SEEN: 'chat.mark_seen',
  MUTE_CONVERSATION: 'chat.mute_conversation',
  PIN_CONVERSATION: 'chat.pin_conversation',
  DELETE_MESSAGE: 'chat.delete_message',
  ADD_MEMBERS: 'chat.add_members',
  REMOVE_MEMBER: 'chat.remove_member',
  SET_MEMBER_ROLE: 'chat.set_member_role',
  LEAVE: 'chat.leave',
  UPDATE_GROUP: 'chat.update_group',
  DELETE_GROUP: 'chat.delete_group',
  BLOCK_USER: 'chat.block_user',
  UNBLOCK_USER: 'chat.unblock_user',
  LIST_BLOCKS: 'chat.list_blocks',
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

export interface SearchMessagesPayload extends ConversationActorPayload {
  query: string;
  page: number;
  limit: number;
}

export interface SendMessagePayload extends ConversationActorPayload {
  body?: string;
  type?: MessageType;
  replyToMessageId?: string;
  attachmentUrl?: string;
  attachmentMime?: string;
  attachmentName?: string;
  attachmentSize?: number;
}

export interface SendMessageResult extends MessageView {
  recipientIds: string[];
}

export interface EditMessagePayload extends ConversationActorPayload {
  messageId: string;
  body: string;
}

export interface ReactMessagePayload extends ConversationActorPayload {
  messageId: string;
  emoji: string;
}

export interface ForwardMessagePayload {
  actorId: string;
  messageId: string;
  fromConversationId: string;
  toConversationId: string;
}

export interface MarkSeenPayload extends ConversationActorPayload {
  messageId?: string;
}

export interface MuteConversationPayload extends ConversationActorPayload {
  muted: boolean;
}

export interface PinConversationPayload extends ConversationActorPayload {
  pinned: boolean;
}

export interface DeleteMessagePayload extends ConversationActorPayload {
  messageId: string;
  forEveryone?: boolean;
}

export interface DeleteMessageResult {
  message: MessageView;
  forEveryone: boolean;
  recipientIds: string[];
}

export interface AddMembersPayload extends ConversationActorPayload {
  memberIds: string[];
}

export interface RemoveMemberPayload extends ConversationActorPayload {
  memberId: string;
}

export interface SetMemberRolePayload extends ConversationActorPayload {
  memberId: string;
  role: ConversationMemberRole.ADMIN | ConversationMemberRole.MEMBER;
}

export interface UpdateGroupPayload extends ConversationActorPayload {
  name: string;
}

export interface BlockUserPayload {
  actorId: string;
  userId: string;
}

export interface ConversationMemberView {
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string;
  lastReadAt: string | null;
  muted: boolean;
  status: PresenceStatus;
  lastSeenAt: string | null;
}

export interface MessageReplyView {
  id: string;
  senderId: string;
  body: string;
  deletedForEveryone: boolean;
}

export interface MessageReactionView {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface MessageAttachmentView {
  url: string;
  mime: string;
  name: string;
  size: number;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: MessageType;
  replyTo: MessageReplyView | null;
  attachment: MessageAttachmentView | null;
  reactions: MessageReactionView[];
  editedAt: string | null;
  forwarded: boolean;
  deletedForEveryone: boolean;
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
  muted: boolean;
  pinned: boolean;
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

export interface BlockView {
  userId: string;
  createdAt: string;
}
