import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PAGINATION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'email',
] as const;

export const PAGINATION_ORDER = ['ASC', 'DESC'] as const;

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit = 10;

  @ApiPropertyOptional({
    type: String,
    example: 'john',
    description: 'Search by first name, last name, or email',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    type: String,
    enum: PAGINATION_SORT_FIELDS,
    example: 'createdAt',
    default: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  @IsIn(PAGINATION_SORT_FIELDS, { message: 'sortBy must be a supported field' })
  @MaxLength(50)
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    type: String,
    enum: PAGINATION_ORDER,
    example: 'DESC',
    default: 'DESC',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(PAGINATION_ORDER, { message: 'order must be ASC or DESC' })
  order: 'ASC' | 'DESC' = 'DESC';
}
