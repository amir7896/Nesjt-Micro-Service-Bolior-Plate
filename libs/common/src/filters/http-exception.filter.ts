import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { HTTP_MESSAGES } from '../constants/http-messages';
import { REQUEST_ID_HEADER } from '../constants/tokens';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? undefined;

    const { statusCode, message, error, details } = this.normalize(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${statusCode} ${message}`,
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return {
          statusCode,
          message: payload,
          error: HttpStatus[statusCode] ?? 'Error',
        };
      }

      const objectPayload = payload as Record<string, unknown>;
      const rawMessage = objectPayload.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join('; ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : (HTTP_MESSAGES[statusCode] ?? exception.message);

      return {
        statusCode,
        message,
        error:
          typeof objectPayload.error === 'string'
            ? objectPayload.error
            : (HttpStatus[statusCode] ?? 'Error'),
        details: objectPayload.details,
      };
    }

    if (exception instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'A database constraint was violated',
        error: 'Bad Request',
        details:
          process.env.NODE_ENV === 'production' ? undefined : exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: HTTP_MESSAGES[500],
      error: 'Internal Server Error',
    };
  }
}
