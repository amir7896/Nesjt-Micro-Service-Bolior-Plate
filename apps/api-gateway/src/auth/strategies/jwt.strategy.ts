import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  ForbiddenAppException,
  JwtPayload,
  UnauthorizedAppException,
} from '@app/common';
import { AUTH_PATTERNS } from '@app/contracts';
import type { AuthUserView } from '@app/contracts';
import { MicroserviceProxy } from '../../infrastructure/proxy/microservice.proxy';
import { AuthSessionCache } from '../auth-session.cache';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly proxy: MicroserviceProxy,
    private readonly sessionCache: AuthSessionCache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
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
        const inner = error.getError() as {
          statusCode?: number;
          message?: string;
        };
        if (inner.statusCode === 403) {
          throw new ForbiddenAppException(
            typeof inner.message === 'string' ? inner.message : undefined,
          );
        }
        throw new UnauthorizedAppException(
          typeof inner.message === 'string' ? inner.message : undefined,
        );
      }
      throw error;
    }
  }
}
