import { Logger } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';

function isAddrInUse(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'EADDRINUSE'
  );
}

/**
 * Bind the debug HTTP port. If it stays in use (another app, or a stale
 * --watch process), keep RabbitMQ consumers running instead of crashing.
 */
export async function listenHttpWithRetry(
  app: INestApplication,
  port: number,
  logger: Logger,
): Promise<boolean> {
  const attempts = 10;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await app.listen(port);
      return true;
    } catch (error) {
      if (!isAddrInUse(error)) {
        throw error;
      }
      if (attempt === attempts) {
        logger.error(
          `HTTP :${port} is in use after ${attempts} attempts. Continuing with RabbitMQ only so login and other RPC calls still work.`,
        );
        return false;
      }
      logger.warn(
        `HTTP :${port} in use (attempt ${attempt}/${attempts}); retrying so the RMQ consumer can stay up`,
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return false;
}
