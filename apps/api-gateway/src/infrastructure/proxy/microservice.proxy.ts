import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AUTH_SERVICE,
  USER_SERVICE,
  ServiceUnavailableAppException,
} from '@app/common';

@Injectable()
export class MicroserviceProxy {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(USER_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  sendAuth<TResult, TInput = unknown>(
    pattern: string,
    payload: TInput,
  ): Promise<TResult> {
    return this.send(this.authClient, pattern, payload);
  }

  sendUser<TResult, TInput = unknown>(
    pattern: string,
    payload: TInput,
  ): Promise<TResult> {
    return this.send(this.userClient, pattern, payload);
  }

  private async send<TResult, TInput>(
    client: ClientProxy,
    pattern: string,
    payload: TInput,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        client.send<TResult, TInput>(pattern, payload).pipe(timeout(8_000)),
      );
    } catch (error) {
      if (this.isTimeout(error)) {
        throw new ServiceUnavailableAppException(
          'The upstream service did not respond in time',
        );
      }
      throw new RpcException(this.asRpcPayload(error));
    }
  }

  private isTimeout(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'TimeoutError'
    );
  }

  private asRpcPayload(error: unknown): Record<string, unknown> {
    if (error instanceof RpcException) {
      const inner = error.getError();
      return typeof inner === 'object' && inner !== null
        ? (inner as Record<string, unknown>)
        : {
            statusCode: 500,
            message: String(inner),
            error: 'Internal Server Error',
          };
    }

    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      if (
        typeof record.statusCode === 'number' &&
        typeof record.message === 'string'
      ) {
        return record;
      }
      if (typeof record.message === 'object' && record.message !== null) {
        return record.message as Record<string, unknown>;
      }
    }

    return {
      statusCode: 500,
      message: 'An unexpected error occurred on the server',
      error: 'Internal Server Error',
    };
  }
}
