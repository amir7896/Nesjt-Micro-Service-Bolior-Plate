import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJWT, IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token to revoke. If omitted, all refresh tokens for the user are revoked.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  @IsJWT({ message: 'refreshToken must be a valid JWT' })
  refreshToken?: string;
}
