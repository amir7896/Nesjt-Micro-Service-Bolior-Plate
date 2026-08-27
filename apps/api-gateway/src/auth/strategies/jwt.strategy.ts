import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedUser,
  JwtPayload,
  UnauthorizedAppException,
} from '@app/common';
import { AuthSessionCache } from '../auth-session.cache';
import { userFromAccessToken } from '../user-from-token';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
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

    const cached = await this.sessionCache.get(payload.sub);
    return userFromAccessToken(payload, cached);
  }
}
