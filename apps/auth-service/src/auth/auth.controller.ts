import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_PATTERNS } from '@app/contracts';
import type {
  ChangePasswordPayload,
  DeactivatePayload,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  ValidatePayload,
} from '@app/contracts';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.REGISTER)
  register(@Payload() payload: RegisterPayload) {
    return this.authService.register(payload);
  }

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  login(@Payload() payload: LoginPayload) {
    return this.authService.login(payload);
  }

  @MessagePattern(AUTH_PATTERNS.REFRESH)
  refresh(@Payload() payload: RefreshPayload) {
    return this.authService.refresh(payload);
  }

  @MessagePattern(AUTH_PATTERNS.LOGOUT)
  logout(@Payload() payload: LogoutPayload) {
    return this.authService.logout(payload);
  }

  @MessagePattern(AUTH_PATTERNS.VALIDATE)
  validate(@Payload() payload: ValidatePayload) {
    return this.authService.validate(payload);
  }

  @MessagePattern(AUTH_PATTERNS.ME)
  me(@Payload() payload: { userId: string }) {
    return this.authService.me(payload.userId);
  }

  @MessagePattern(AUTH_PATTERNS.CHANGE_PASSWORD)
  changePassword(@Payload() payload: ChangePasswordPayload) {
    return this.authService.changePassword(payload);
  }

  @MessagePattern(AUTH_PATTERNS.DEACTIVATE)
  deactivate(@Payload() payload: DeactivatePayload) {
    return this.authService.deactivate(payload);
  }
}
