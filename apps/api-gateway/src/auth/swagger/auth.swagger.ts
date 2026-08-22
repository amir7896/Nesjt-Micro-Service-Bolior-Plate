import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses, ApiWrappedResponse } from '@app/common';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import {
  AuthResultSchema,
  AuthUserSchema,
  LogoutResultSchema,
  PasswordChangedSchema,
} from './auth.schema';

export const AuthDocs = () =>
  applyDecorators(ApiTags('Auth'), ApiErrorResponses());

export const RegisterDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register a new account' }),
    ApiBody({ type: RegisterDto }),
    ApiWrappedResponse(AuthResultSchema, {
      status: 201,
      description: 'Account created successfully',
    }),
  );

export const LoginDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Authenticate with email and password' }),
    ApiBody({ type: LoginDto }),
    ApiWrappedResponse(AuthResultSchema, {
      description: 'Logged in successfully',
    }),
  );

export const RefreshDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Rotate refresh token and issue a new access token',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiWrappedResponse(AuthResultSchema, {
      description: 'Access token refreshed successfully',
    }),
  );

export const LogoutDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Revoke the current session' }),
    ApiBody({ type: LogoutDto, required: false }),
    ApiWrappedResponse(LogoutResultSchema, {
      description: 'Logged out successfully',
    }),
  );

export const MeDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get the authenticated user' }),
    ApiWrappedResponse(AuthUserSchema, {
      description: 'Profile retrieved successfully',
    }),
  );

export const ChangePasswordDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Change the authenticated user password' }),
    ApiBody({ type: ChangePasswordDto }),
    ApiWrappedResponse(PasswordChangedSchema, {
      description: 'Password changed successfully',
    }),
  );
