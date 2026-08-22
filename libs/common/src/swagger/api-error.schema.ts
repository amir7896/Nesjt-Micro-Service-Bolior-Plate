import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseSchema {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    example:
      'The request could not be understood or was missing required parameters',
    description:
      'Human-readable error message. The same envelope is used for every resource.',
  })
  message!: string;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string' },
    },
    description:
      'Present only when the server can name the invalid fields. Typical for 400 and 422. Omitted on 401, 403, 404, 429, and 500.',
  })
  details?: Record<string, string[]>;

  @ApiProperty({ example: '2026-08-22T06:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/resources' })
  path!: string;

  @ApiPropertyOptional({ example: '8c2d3f1a-4b5e-6d7c-8e9f-0a1b2c3d4e5f' })
  requestId?: string;
}
