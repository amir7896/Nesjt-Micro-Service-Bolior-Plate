import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionBody {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  details?: unknown;
}

export class AppException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    message: string,
    error?: string,
    details?: unknown,
  ) {
    const body: AppExceptionBody = {
      success: false,
      statusCode,
      message,
      error: error ?? HttpStatus[statusCode] ?? 'Error',
      ...(details !== undefined ? { details } : {}),
    };
    super(body, statusCode);
  }
}

export class BadRequestAppException extends AppException {
  constructor(message = 'Bad request', details?: unknown) {
    super(HttpStatus.BAD_REQUEST, message, 'Bad Request', details);
  }
}

export class UnauthorizedAppException extends AppException {
  constructor(
    message = 'Authentication is required or the provided credentials are invalid',
  ) {
    super(HttpStatus.UNAUTHORIZED, message, 'Unauthorized');
  }
}

export class ForbiddenAppException extends AppException {
  constructor(message = 'You do not have permission to access this resource') {
    super(HttpStatus.FORBIDDEN, message, 'Forbidden');
  }
}

export class NotFoundAppException extends AppException {
  constructor(resource = 'Resource') {
    super(HttpStatus.NOT_FOUND, `${resource} not found`, 'Not Found');
  }
}

export class ConflictAppException extends AppException {
  constructor(
    message = 'The request conflicts with the current state of the resource',
  ) {
    super(HttpStatus.CONFLICT, message, 'Conflict');
  }
}

export class ValidationAppException extends AppException {
  constructor(
    details?: unknown,
    message = 'The request was well-formed but failed validation',
  ) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      message,
      'Unprocessable Entity',
      details,
    );
  }
}

export class TooManyRequestsAppException extends AppException {
  constructor(message = 'Too many requests. Please try again later') {
    super(HttpStatus.TOO_MANY_REQUESTS, message, 'Too Many Requests');
  }
}

export class InternalServerAppException extends AppException {
  constructor(message = 'An unexpected error occurred on the server') {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, 'Internal Server Error');
  }
}

export class ServiceUnavailableAppException extends AppException {
  constructor(message = 'The service is temporarily unavailable') {
    super(HttpStatus.SERVICE_UNAVAILABLE, message, 'Service Unavailable');
  }
}

export class GatewayTimeoutAppException extends AppException {
  constructor(message = 'The upstream service did not respond in time') {
    super(HttpStatus.GATEWAY_TIMEOUT, message, 'Gateway Timeout');
  }
}
