import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  PresenceStatus,
} from '@app/common';

export class ConversationMemberSchema {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: ConversationMemberRole })
  role!: ConversationMemberRole;

  @ApiProperty()
  joinedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  lastReadAt!: string | null;

  @ApiProperty({ example: false })
  muted!: boolean;

  @ApiProperty({ enum: PresenceStatus })
  status!: PresenceStatus;

  @ApiPropertyOptional({ nullable: true })
  lastSeenAt!: string | null;
}

export class MessageSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  senderId!: string;

  @ApiProperty({ example: 'Hello there' })
  body!: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type!: MessageType;

  @ApiPropertyOptional({ nullable: true })
  replyTo!: {
    id: string;
    senderId: string;
    body: string;
    deletedForEveryone: boolean;
  } | null;

  @ApiPropertyOptional({ nullable: true })
  attachment!: {
    url: string;
    mime: string;
    name: string;
    size: number;
  } | null;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  reactions!: Array<{ emoji: string; count: number; reactedByMe: boolean }>;

  @ApiPropertyOptional({ nullable: true })
  editedAt!: string | null;

  @ApiProperty({ example: false })
  forwarded!: boolean;

  @ApiProperty({ example: false })
  deletedForEveryone!: boolean;

  @ApiProperty({
    type: [String],
    description: 'Account ids (except the sender) who have seen this message',
  })
  seenBy!: string[];

  @ApiProperty()
  createdAt!: string;
}

export class ConversationSchema {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ConversationType })
  type!: ConversationType;

  @ApiPropertyOptional({ example: 'Weekend trip', nullable: true })
  name!: string | null;

  @ApiProperty({ format: 'uuid' })
  createdBy!: string;

  @ApiPropertyOptional({ nullable: true })
  lastMessageAt!: string | null;

  @ApiPropertyOptional({ type: MessageSchema, nullable: true })
  lastMessage!: MessageSchema | null;

  @ApiPropertyOptional({ nullable: true })
  lastReadAt!: string | null;

  @ApiProperty({ example: false })
  muted!: boolean;

  @ApiProperty({ example: false })
  pinned!: boolean;

  @ApiProperty({ example: 0 })
  unreadCount!: number;

  @ApiProperty({ type: [ConversationMemberSchema] })
  members!: ConversationMemberSchema[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class LeftResultSchema {
  @ApiProperty({ example: true })
  left!: boolean;
}

export class DeletedGroupResultSchema {
  @ApiProperty({ example: true })
  deleted!: boolean;
}

export class TypingResultSchema {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ example: true })
  typing!: boolean;
}

export class SeenResultSchema {
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  lastReadAt!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  messageId!: string | null;
}

export class PresenceSchema {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: PresenceStatus })
  status!: PresenceStatus;

  @ApiPropertyOptional({ nullable: true })
  lastSeenAt!: string | null;
}
