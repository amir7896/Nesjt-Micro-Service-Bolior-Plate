import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AUTH_SERVICE,
  CHAT_SERVICE,
  GatewayTimeoutAppException,
  InflightLimiter,
  USER_SERVICE,
} from '@app/common';

@Injectable()
export class MicroserviceProxy {
  private readonly limiter: InflightLimiter;
  private readonly rpcTimeoutMs: number;

  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(USER_SERVICE) private readonly userClient: ClientProxy,
    @Inject(CHAT_SERVICE) private readonly chatClient: ClientProxy,
    config: ConfigService,
  ) {
    this.limiter = new InflightLimiter(
      config.get<number>('GATEWAY_MAX_INFLIGHT', 2_000),
    );
    this.rpcTimeoutMs = Math.min(
      config.get<number>('GATEWAY_TIMEOUT_MS', 10_000),
      8_000,
    );
  }

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

  sendChat<TResult, TInput = unknown>(
    pattern: string,
    payload: TInput,
  ): Promise<TResult> {
    return this.send(this.chatClient, pattern, payload);
  }

  private async send<TResult, TInput>(
    client: ClientProxy,
    pattern: string,
    payload: TInput,
  ): Promise<TResult> {
    await this.limiter.acquire();
    try {
      return await firstValueFrom(
        client
          .send<TResult, TInput>(pattern, payload)
          .pipe(timeout(this.rpcTimeoutMs)),
      );
    } catch (error) {
      if (this.isTimeout(error)) {
        throw new GatewayTimeoutAppException(
          'The upstream service did not respond in time',
        );
      }
      throw new RpcException(this.asRpcPayload(error));
    } finally {
      this.limiter.release();
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
