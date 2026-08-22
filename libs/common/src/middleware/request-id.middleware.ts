import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '../constants/tokens';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming =
      req.header(REQUEST_ID_HEADER) ?? req.header(CORRELATION_ID_HEADER);
    const requestId =
      incoming && incoming.trim().length > 0 ? incoming : randomUUID();

    req.headers[REQUEST_ID_HEADER] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
