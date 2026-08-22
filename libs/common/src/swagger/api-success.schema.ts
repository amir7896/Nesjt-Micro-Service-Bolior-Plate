import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaSchema {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class ApiSuccessEnvelopeSchema {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Request completed successfully' })
  message!: string;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/resources' })
  path!: string;

  @ApiPropertyOptional({ example: '8c2d3f1a-4b5e-6d7c-8e9f-0a1b2c3d4e5f' })
  requestId?: string;
}
