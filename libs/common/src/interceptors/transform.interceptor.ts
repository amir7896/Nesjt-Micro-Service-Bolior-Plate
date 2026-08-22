import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { HTTP_MESSAGES } from '../constants/http-messages';
import { REQUEST_ID_HEADER } from '../constants/tokens';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';

export interface ResponseEnvelope<T> {
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId =
      (request.headers[REQUEST_ID_HEADER] as string | undefined) ?? undefined;

    return next.handle().pipe(
      map((payload) => {
        if (payload instanceof StreamableFile) {
          return payload;
        }

        const statusCode = response.statusCode || HttpStatus.OK;
        const envelope = this.unwrap(payload);

        return {
          success: true as const,
          statusCode,
          message:
            envelope.message ?? HTTP_MESSAGES[statusCode] ?? HTTP_MESSAGES[200],
          data: envelope.data,
          ...(envelope.meta ? { meta: envelope.meta } : {}),
          timestamp: new Date().toISOString(),
          path: request.url,
          requestId,
        };
      }),
    );
  }

  private unwrap(payload: T): ResponseEnvelope<T> {
    if (payload !== null && typeof payload === 'object' && 'data' in payload) {
      const record = payload as unknown as ResponseEnvelope<T> & {
        message?: string;
      };
      return {
        message: record.message,
        data: record.data,
        meta: record.meta,
      };
    }

    return { data: payload };
  }
}
