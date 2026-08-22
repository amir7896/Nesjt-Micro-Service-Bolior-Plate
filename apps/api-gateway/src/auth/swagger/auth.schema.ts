import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/common';

export class AuthUserSchema {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false })
  isEmailVerified!: boolean;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  updatedAt!: string;
}

export class TokenPairSchema {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: '1d' })
  expiresIn!: string;
}

export class AuthResultSchema {
  @ApiProperty({ type: AuthUserSchema })
  user!: AuthUserSchema;

  @ApiProperty({ type: TokenPairSchema })
  tokens!: TokenPairSchema;
}

export class LogoutResultSchema {
  @ApiProperty({ example: true })
  revoked!: boolean;
}

export class PasswordChangedSchema {
  @ApiProperty({ example: true })
  changed!: boolean;
}
