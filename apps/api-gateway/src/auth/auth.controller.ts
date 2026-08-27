import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  AuthenticatedUser,
  CurrentUser,
  Public,
  AUTH_SUCCESS_MESSAGES,
} from '@app/common';
import { AUTH_PATTERNS, USER_PATTERNS } from '@app/contracts';
import type { AuthResult, AuthUserView } from '@app/contracts';
import { MicroserviceProxy } from '../infrastructure/proxy/microservice.proxy';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuthSessionCache } from './auth-session.cache';
import {
  AuthDocs,
  ChangePasswordDocs,
  LoginDocs,
  LogoutDocs,
  MeDocs,
  RefreshDocs,
  RegisterDocs,
} from './swagger/auth.swagger';

@AuthDocs()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly proxy: MicroserviceProxy,
    private readonly blacklist: TokenBlacklistService,
    private readonly sessionCache: AuthSessionCache,
  ) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RegisterDocs()
  async register(@Body() dto: RegisterDto) {
    const result = await this.proxy.sendAuth<AuthResult>(
      AUTH_PATTERNS.REGISTER,
      dto,
    );
    try {
      await this.proxy.sendUser(USER_PATTERNS.CREATE_PROFILE, {
        userId: result.user.id,
        email: result.user.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    } catch (error) {
      try {
        await this.proxy.sendAuth(AUTH_PATTERNS.DEACTIVATE, {
          userId: result.user.id,
        });
      } catch {
        // Compensation is best-effort so the original profile failure is still reported.
      }
      throw error;
    }
    await this.sessionCache.set(result.user);
    return { message: AUTH_SUCCESS_MESSAGES.REGISTERED, data: result };
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LoginDocs()
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const result = await this.proxy.sendAuth<AuthResult>(AUTH_PATTERNS.LOGIN, {
      ...dto,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    await this.sessionCache.set(result.user);
    return { message: AUTH_SUCCESS_MESSAGES.LOGGED_IN, data: result };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RefreshDocs()
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    const result = await this.proxy.sendAuth<AuthResult>(
      AUTH_PATTERNS.REFRESH,
      {
        refreshToken: dto.refreshToken,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    );
    await this.sessionCache.set(result.user);
    return { message: AUTH_SUCCESS_MESSAGES.TOKEN_REFRESHED, data: result };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @LogoutDocs()
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: LogoutDto = {},
  ) {
    const accessToken = request.headers.authorization?.replace('Bearer ', '');
    if (accessToken) {
      await this.blacklist.revokeAccessToken(accessToken);
    }
    await this.sessionCache.invalidate(user.id);

    await this.proxy.sendAuth(AUTH_PATTERNS.LOGOUT, {
      userId: user.id,
      refreshToken: dto.refreshToken,
      accessToken,
    });

    return {
      message: AUTH_SUCCESS_MESSAGES.LOGGED_OUT,
      data: { revoked: true },
    };
  }

  @Get('me')
  @MeDocs()
  async me(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.proxy.sendAuth<AuthUserView>(AUTH_PATTERNS.ME, {
      userId: user.id,
    });
    return { message: AUTH_SUCCESS_MESSAGES.PROFILE_FETCHED, data };
  }

  @Patch('password')
  @ChangePasswordDocs()
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    const data = await this.proxy.sendAuth(AUTH_PATTERNS.CHANGE_PASSWORD, {
      userId: user.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
    const accessToken = request.headers.authorization?.replace('Bearer ', '');
    if (accessToken) {
      await this.blacklist.revokeAccessToken(accessToken);
    }
    await this.sessionCache.invalidate(user.id);
    return { message: AUTH_SUCCESS_MESSAGES.PASSWORD_CHANGED, data };
  }
}
