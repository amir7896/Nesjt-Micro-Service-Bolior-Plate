import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  AuthenticatedUser,
  CurrentUser,
  PaginationQueryDto,
  ParseUuidPipe,
  Roles,
  USER_SUCCESS_MESSAGES,
  UserRole,
} from '@app/common';
import { AUTH_PATTERNS, USER_PATTERNS } from '@app/contracts';
import type { UserProfileView } from '@app/contracts';
import { MicroserviceProxy } from '../infrastructure/proxy/microservice.proxy';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  DeleteUserDocs,
  GetMyProfileDocs,
  GetUserDocs,
  ListDirectoryDocs,
  ListUsersDocs,
  UpdateMyProfileDocs,
  UpdateUserDocs,
  UsersDocs,
} from './swagger/users.swagger';

@UsersDocs()
@Controller('users')
export class UsersController {
  constructor(private readonly proxy: MicroserviceProxy) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @ListUsersDocs()
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.proxy.sendUser(USER_PATTERNS.FIND_ALL, query);
    return { message: USER_SUCCESS_MESSAGES.USERS_FETCHED, data };
  }

  @Get('me')
  @GetMyProfileDocs()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.FIND_BY_USER_ID,
      {
        userId: user.id,
      },
    );
    return { message: USER_SUCCESS_MESSAGES.PROFILE_FETCHED, data };
  }

  @Get('directory')
  @ListDirectoryDocs()
  async directory(@Query() query: PaginationQueryDto) {
    const data = await this.proxy.sendUser(USER_PATTERNS.FIND_ALL, query);
    return { message: USER_SUCCESS_MESSAGES.USERS_FETCHED, data };
  }

  @Get('lookup/:userId')
  async lookupByUserId(@Param('userId', ParseUuidPipe) userId: string) {
    const data = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.FIND_BY_USER_ID,
      { userId },
    );
    return { message: USER_SUCCESS_MESSAGES.PROFILE_FETCHED, data };
  }

  @Patch('me')
  @UpdateMyProfileDocs()
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.UPDATE,
      {
        userId: user.id,
        ...dto,
      },
    );
    return { message: USER_SUCCESS_MESSAGES.USER_UPDATED, data };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @GetUserDocs()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const data = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.FIND_ONE,
      { id },
    );
    return { message: USER_SUCCESS_MESSAGES.USER_FETCHED, data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UpdateUserDocs()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.FIND_ONE,
      { id },
    );
    const data = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.UPDATE,
      {
        userId: profile.userId,
        ...dto,
      },
    );
    return { message: USER_SUCCESS_MESSAGES.USER_UPDATED, data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @DeleteUserDocs()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const profile = await this.proxy.sendUser<UserProfileView>(
      USER_PATTERNS.FIND_ONE,
      { id },
    );
    await this.proxy.sendAuth(AUTH_PATTERNS.DEACTIVATE, {
      userId: profile.userId,
    });
    const data = await this.proxy.sendUser(USER_PATTERNS.REMOVE, {
      userId: profile.userId,
    });
    return { message: USER_SUCCESS_MESSAGES.USER_DELETED, data };
  }
}
