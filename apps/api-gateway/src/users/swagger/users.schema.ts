import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileSchema {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  userId!: string;

  @ApiProperty({ example: 'jane.doe@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'Jane' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+15551234567', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'Backend engineer', nullable: true })
  bio!: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
    nullable: true,
  })
  avatar!: string | null;

  @ApiPropertyOptional({ example: '1994-04-12', nullable: true })
  dateOfBirth!: string | null;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  updatedAt!: string;
}

export class DeletedResultSchema {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
