import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Socket } from 'socket.io';
import {
  AuthenticatedUser,
  JwtPayload,
  UnauthorizedAppException,
} from '@app/common';
import { AUTH_PATTERNS } from '@app/contracts';
import type { AuthUserView } from '@app/contracts';
import { TokenBlacklistService } from '../auth/token-blacklist.service';
import { AuthSessionCache } from '../auth/auth-session.cache';
import { MicroserviceProxy } from '../infrastructure/proxy/microservice.proxy';

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly blacklist: TokenBlacklistService,
    private readonly proxy: MicroserviceProxy,
    private readonly sessionCache: AuthSessionCache,
  ) {}

  async authenticate(client: Socket): Promise<AuthenticatedUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedAppException('Access token is required');
    }
    if (await this.blacklist.isRevoked(token)) {
      throw new UnauthorizedAppException('Access token has been revoked');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedAppException('Access token is invalid or expired');
    }

    if (payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedAppException('Access token is required');
    }

    try {
      const cached = await this.sessionCache.get(payload.sub);
      const user =
        cached ??
        (await this.proxy.sendAuth<AuthUserView>(AUTH_PATTERNS.VALIDATE, {
          userId: payload.sub,
        }));
      if (!cached) {
        await this.sessionCache.set(user);
      }
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw new UnauthorizedAppException('User session is no longer valid');
      }
      throw error;
    }
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.length > 0) {
      return fromAuth.replace(/^Bearer\s+/i, '');
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }
}
