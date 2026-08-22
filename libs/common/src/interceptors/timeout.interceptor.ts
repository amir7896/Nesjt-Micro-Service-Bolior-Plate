import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  Observable,
  TimeoutError,
  catchError,
  throwError,
  timeout,
} from 'rxjs';
import { GatewayTimeoutAppException } from '../exceptions/app.exception';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly ms = 10_000;

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.ms),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new GatewayTimeoutAppException());
        }
        return throwError(() => error);
      }),
    );
  }
}
