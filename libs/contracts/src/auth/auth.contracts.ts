import { UserRole } from '@app/common';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface RefreshPayload {
  refreshToken: string;
  ip?: string;
  userAgent?: string;
}

export interface LogoutPayload {
  userId: string;
  refreshToken?: string;
  accessToken?: string;
}

export interface ValidatePayload {
  userId: string;
}

export interface DeactivatePayload {
  userId: string;
}

export interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface AuthUserView {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthResult {
  user: AuthUserView;
  tokens: TokenPair;
}
