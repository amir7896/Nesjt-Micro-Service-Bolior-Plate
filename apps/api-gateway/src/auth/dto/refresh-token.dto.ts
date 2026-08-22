import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token from login or register',
  })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken is required' })
  @IsJWT({ message: 'refreshToken must be a valid JWT' })
  refreshToken!: string;
}
