import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import {
  UserRole,
  hashPassword,
  parseDurationMs,
  verifyPassword,
} from '@app/common';
import { RpcErrors } from '@app/common';
import {
  AuthResult,
  AuthUserView,
  ChangePasswordPayload,
  DeactivatePayload,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  TokenPair,
  ValidatePayload,
} from '@app/contracts';
import { AuthUser } from '../database/entities/auth-user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AuthUser)
    private readonly users: Repository<AuthUser>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureAdmin();
  }

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const email = payload.email.toLowerCase().trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      return RpcErrors.conflict('An account with this email already exists');
    }

    const user = this.users.create({
      email,
      password: await hashPassword(payload.password),
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: false,
    });

    try {
      const saved = await this.users.save(user);
      const tokens = await this.issueTokens(saved);
      return { user: this.toView(saved), tokens };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return RpcErrors.conflict('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(payload: LoginPayload): Promise<AuthResult> {
    const email = payload.email.toLowerCase().trim();
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      return RpcErrors.unauthorized('Invalid email or password');
    }

    const passwordMatches = await verifyPassword(
      payload.password,
      user.password,
    );
    if (!passwordMatches) {
      return RpcErrors.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      return RpcErrors.forbidden('This account has been deactivated');
    }

    const tokens = await this.issueTokens(user, payload.ip, payload.userAgent);
    return { user: this.toView(user), tokens };
  }

  async refresh(payload: RefreshPayload): Promise<AuthResult> {
    const tokenHash = this.hashToken(payload.refreshToken);

    try {
      const decoded = this.jwt.verify<{ type?: string }>(payload.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (decoded.type !== 'refresh') {
        return RpcErrors.unauthorized('Refresh token is invalid or expired');
      }
    } catch {
      return RpcErrors.unauthorized('Refresh token is invalid or expired');
    }

    return this.refreshTokens.manager.transaction(async (manager) => {
      const stored = await manager
        .getRepository(RefreshToken)
        .createQueryBuilder('token')
        .innerJoinAndSelect('token.user', 'user')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .setLock('pessimistic_write')
        .getOne();

      if (
        !stored ||
        stored.revoked ||
        stored.expiresAt.getTime() < Date.now()
      ) {
        return RpcErrors.unauthorized('Refresh token is invalid or expired');
      }

      if (!stored.user.isActive) {
        return RpcErrors.forbidden('This account has been deactivated');
      }

      stored.revoked = true;
      await manager.save(stored);

      const tokens = await this.issueTokens(
        stored.user,
        payload.ip,
        payload.userAgent,
        manager.getRepository(RefreshToken),
      );
      return { user: this.toView(stored.user), tokens };
    });
  }

  async logout(payload: LogoutPayload): Promise<{ revoked: boolean }> {
    if (payload.refreshToken) {
      const tokenHash = this.hashToken(payload.refreshToken);
      await this.refreshTokens.update(
        { tokenHash, userId: payload.userId },
        { revoked: true },
      );
    } else {
      await this.refreshTokens.update(
        { userId: payload.userId, revoked: false },
        { revoked: true },
      );
    }
    return { revoked: true };
  }

  async validate(payload: ValidatePayload): Promise<AuthUserView> {
    const user = await this.users.findOne({ where: { id: payload.userId } });
    if (!user) {
      return RpcErrors.unauthorized('User session is no longer valid');
    }
    if (!user.isActive) {
      return RpcErrors.forbidden('This account has been deactivated');
    }
    return this.toView(user);
  }

  async me(userId: string): Promise<AuthUserView> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      return RpcErrors.notFound('User');
    }
    return this.toView(user);
  }

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<{ changed: boolean }> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: payload.userId })
      .getOne();

    if (!user) {
      return RpcErrors.notFound('User');
    }

    if (!(await verifyPassword(payload.currentPassword, user.password))) {
      return RpcErrors.unauthorized('Current password is incorrect');
    }

    user.password = await hashPassword(payload.newPassword);
    await this.users.save(user);
    await this.refreshTokens.update(
      { userId: user.id, revoked: false },
      { revoked: true },
    );

    return { changed: true };
  }

  async deactivate(
    payload: DeactivatePayload,
  ): Promise<{ deactivated: boolean }> {
    const user = await this.users.findOne({ where: { id: payload.userId } });
    if (!user) {
      return RpcErrors.notFound('User');
    }

    user.isActive = false;
    await this.users.save(user);
    await this.refreshTokens.update(
      { userId: user.id, revoked: false },
      { revoked: true },
    );
    await this.users.softRemove(user);
    return { deactivated: true };
  }

  private async ensureAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase().trim();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email) {
      return;
    }

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.ADMIN) {
        existing.role = UserRole.ADMIN;
        await this.users.save(existing);
        this.logger.log(
          `Promoted ${email} to admin. Log in again to get a new access token.`,
        );
      }
      return;
    }

    if (!password) {
      this.logger.warn(
        `ADMIN_EMAIL=${email} was set but the user does not exist and ADMIN_PASSWORD is empty`,
      );
      return;
    }

    const user = this.users.create({
      email,
      password: await hashPassword(password),
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
    });
    await this.users.save(user);
    this.logger.log(`Created admin account ${email}`);
  }

  private async issueTokens(
    user: AuthUser,
    ip?: string,
    userAgent?: string,
    tokens = this.refreshTokens,
  ): Promise<TokenPair> {
    const accessExpiresIn = this.config.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '1d',
    );
    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        jwtid: randomUUID(),
      },
    );

    const entity = tokens.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationMs(refreshExpiresIn)),
      userAgent: userAgent ?? null,
      ip: ip ?? null,
    });
    await tokens.save(entity);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver = error.driverError as { code?: string } | undefined;
    return driver?.code === '23505';
  }

  private toView(user: AuthUser): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
