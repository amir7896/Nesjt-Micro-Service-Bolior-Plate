import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CHAT_PATTERNS } from '@app/contracts';
import type {
  AddMembersPayload,
  ConversationActorPayload,
  CreateGroupChatPayload,
  CreatePrivateChatPayload,
  ListConversationsPayload,
  ListMessagesPayload,
  MarkSeenPayload,
  RemoveMemberPayload,
  SendMessagePayload,
  UpdateGroupPayload,
} from '@app/contracts';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(CHAT_PATTERNS.CREATE_PRIVATE)
  createPrivate(@Payload() payload: CreatePrivateChatPayload) {
    return this.chatService.createPrivate(payload);
  }

  @MessagePattern(CHAT_PATTERNS.CREATE_GROUP)
  createGroup(@Payload() payload: CreateGroupChatPayload) {
    return this.chatService.createGroup(payload);
  }

  @MessagePattern(CHAT_PATTERNS.LIST_CONVERSATIONS)
  listConversations(@Payload() payload: ListConversationsPayload) {
    return this.chatService.listConversations(payload);
  }

  @MessagePattern(CHAT_PATTERNS.GET_CONVERSATION)
  getConversation(@Payload() payload: ConversationActorPayload) {
    return this.chatService.getConversation(payload);
  }

  @MessagePattern(CHAT_PATTERNS.LIST_MESSAGES)
  listMessages(@Payload() payload: ListMessagesPayload) {
    return this.chatService.listMessages(payload);
  }

  @MessagePattern(CHAT_PATTERNS.SEND_MESSAGE)
  sendMessage(@Payload() payload: SendMessagePayload) {
    return this.chatService.sendMessage(payload);
  }

  @MessagePattern(CHAT_PATTERNS.MARK_SEEN)
  markSeen(@Payload() payload: MarkSeenPayload) {
    return this.chatService.markSeen(payload);
  }

  @MessagePattern(CHAT_PATTERNS.ADD_MEMBERS)
  addMembers(@Payload() payload: AddMembersPayload) {
    return this.chatService.addMembers(payload);
  }

  @MessagePattern(CHAT_PATTERNS.REMOVE_MEMBER)
  removeMember(@Payload() payload: RemoveMemberPayload) {
    return this.chatService.removeMember(payload);
  }

  @MessagePattern(CHAT_PATTERNS.LEAVE)
  leave(@Payload() payload: ConversationActorPayload) {
    return this.chatService.leave(payload);
  }

  @MessagePattern(CHAT_PATTERNS.UPDATE_GROUP)
  updateGroup(@Payload() payload: UpdateGroupPayload) {
    return this.chatService.updateGroup(payload);
  }
}
