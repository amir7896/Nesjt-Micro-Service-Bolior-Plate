import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { USER_PATTERNS } from '@app/contracts';
import type {
  CreateProfilePayload,
  FindUsersPayload,
  UpdateProfilePayload,
} from '@app/contracts';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.CREATE_PROFILE)
  createProfile(@Payload() payload: CreateProfilePayload) {
    return this.usersService.createProfile(payload);
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  findAll(@Payload() payload: FindUsersPayload) {
    return this.usersService.findAll(payload);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  findOne(@Payload() payload: { id: string }) {
    return this.usersService.findOne(payload.id);
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_USER_ID)
  findByUserId(@Payload() payload: { userId: string }) {
    return this.usersService.findByUserId(payload.userId);
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  update(@Payload() payload: UpdateProfilePayload) {
    return this.usersService.update(payload);
  }

  @MessagePattern(USER_PATTERNS.REMOVE)
  remove(@Payload() payload: { userId: string }) {
    return this.usersService.remove(payload.userId);
  }
}
