import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { HTTP_MESSAGES } from '../constants/http-messages';
import { REQUEST_ID_HEADER } from '../constants/tokens';
import { RpcErrorPayload } from '../exceptions/rpc-app.exception';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? undefined;

    const error = exception.getError();
    const payload = this.asPayload(error);

    this.logger.warn(
      `${request.method} ${request.url} ${payload.statusCode} ${payload.message}`,
    );

    const body: ApiErrorResponse = {
      success: false,
      statusCode: payload.statusCode,
      message: payload.message,
      error: payload.error,
      ...(payload.details !== undefined ? { details: payload.details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    response.status(payload.statusCode).json(body);
  }

  private asPayload(error: string | object): RpcErrorPayload {
    if (typeof error === 'string') {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
        error: 'Internal Server Error',
      };
    }

    const record = error as Record<string, unknown>;
    const statusCode =
      typeof record.statusCode === 'number'
        ? record.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,
      message:
        typeof record.message === 'string'
          ? record.message
          : HTTP_MESSAGES[statusCode],
      error:
        typeof record.error === 'string'
          ? record.error
          : (HttpStatus[statusCode] ?? 'Error'),
      details: record.details,
    };
  }
}
