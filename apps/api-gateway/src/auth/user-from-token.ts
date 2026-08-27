import type { AuthenticatedUser, JwtPayload } from '@app/common';
import { ForbiddenAppException } from '@app/common';
import type { AuthUserView } from '@app/contracts';

export function userFromAccessToken(
  payload: JwtPayload,
  cached?: AuthUserView | null,
): AuthenticatedUser {
  if (cached) {
    if (!cached.isActive) {
      throw new ForbiddenAppException('This account has been deactivated');
    }
    return {
      id: cached.id,
      email: cached.email,
      role: cached.role,
      isActive: cached.isActive,
      isEmailVerified: cached.isEmailVerified,
    };
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    isActive: true,
    isEmailVerified: false,
  };
}
