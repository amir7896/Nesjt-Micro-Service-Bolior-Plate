import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { HTTP_MESSAGES } from '../constants/http-messages';
import { ApiErrorResponseSchema } from './api-error.schema';
import {
  ApiSuccessEnvelopeSchema,
  PaginationMetaSchema,
} from './api-success.schema';

interface WrappedResponseOptions {
  status?: number;
  description?: string;
}

export const ApiWrappedResponse = <TModel extends Type<unknown>>(
  model: TModel,
  options: WrappedResponseOptions = {},
) => {
  const status = options.status ?? 200;
  const Response = status === 201 ? ApiCreatedResponse : ApiOkResponse;

  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeSchema, model),
    Response({
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessEnvelopeSchema) },
          {
            properties: {
              statusCode: { type: 'number', example: status },
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeSchema, PaginationMetaSchema, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessEnvelopeSchema) },
          {
            properties: {
              data: {
                type: 'object',
                required: ['items', 'meta'],
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: { $ref: getSchemaPath(PaginationMetaSchema) },
                },
              },
            },
          },
        ],
      },
    }),
  );

const httpErrorTitle = (status: number): string => {
  const key = HttpStatus[status];
  if (typeof key !== 'string') {
    return 'Error';
  }

  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ERROR_DETAILS: Partial<Record<number, Record<string, string[]>>> = {
  [HttpStatus.BAD_REQUEST]: {
    id: ['id must be a valid UUID'],
  },
  [HttpStatus.CONFLICT]: {
    code: ['A resource with this code already exists'],
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    name: ['name should not be empty'],
    price: ['price must be a positive number'],
  },
};

const errorResponse = (status: number) => {
  const details = ERROR_DETAILS[status];

  return {
    description: HTTP_MESSAGES[status],
    schema: { $ref: getSchemaPath(ApiErrorResponseSchema) },
    example: {
      success: false,
      statusCode: status,
      message: HTTP_MESSAGES[status],
      error: httpErrorTitle(status),
      ...(details ? { details } : {}),
      timestamp: '2026-08-22T06:00:00.000Z',
      path: '/api/resources',
      requestId: '8c2d3f1a-4b5e-6d7c-8e9f-0a1b2c3d4e5f',
    },
  };
};

export const ApiErrorResponses = () =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseSchema),
    ApiBadRequestResponse(errorResponse(HttpStatus.BAD_REQUEST)),
    ApiUnauthorizedResponse(errorResponse(HttpStatus.UNAUTHORIZED)),
    ApiForbiddenResponse(errorResponse(HttpStatus.FORBIDDEN)),
    ApiNotFoundResponse(errorResponse(HttpStatus.NOT_FOUND)),
    ApiConflictResponse(errorResponse(HttpStatus.CONFLICT)),
    ApiUnprocessableEntityResponse(
      errorResponse(HttpStatus.UNPROCESSABLE_ENTITY),
    ),
    ApiTooManyRequestsResponse(errorResponse(HttpStatus.TOO_MANY_REQUESTS)),
    ApiInternalServerErrorResponse(
      errorResponse(HttpStatus.INTERNAL_SERVER_ERROR),
    ),
  );
