import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MessageType } from '@app/common';

export class CreatePrivateChatDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'The other user’s account id (`userId` from the profile or `/auth/me`)',
  })
  @IsUUID('4')
  userId!: string;
}

export class CreateGroupChatDto {
  @ApiProperty({ example: 'Weekend trip' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    type: [String],
    example: ['7c9e6679-7425-40de-944b-e07fc1f90ae7'],
    description: 'Account ids of other members',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(49)
  @IsUUID('4', { each: true })
  memberIds!: string[];
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello there' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

export class TypingDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  typing!: boolean;
}

export class MarkSeenDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Mark as read up to this message. Omit to mark everything as seen now.',
  })
  @IsOptional()
  @IsUUID('4')
  messageId?: string;
}

export class AddMembersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(49)
  @IsUUID('4', { each: true })
  memberIds!: string[];
}

export class UpdateGroupDto {
  @ApiProperty({ example: 'Project Alpha' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class ChatPageQueryDto {
  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
