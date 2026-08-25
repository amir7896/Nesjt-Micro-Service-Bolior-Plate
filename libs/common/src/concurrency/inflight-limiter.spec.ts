import { InflightLimiter } from './inflight-limiter';

describe('InflightLimiter', () => {
  it('runs extra callers after a slot frees instead of rejecting them', async () => {
    const limiter = new InflightLimiter(1);
    const order: string[] = [];

    await limiter.acquire();
    const waiting = limiter.acquire().then(() => {
      order.push('second');
    });

    expect(limiter.queued).toBe(1);
    order.push('first-release');
    limiter.release();
    await waiting;
    limiter.release();

    expect(order).toEqual(['first-release', 'second']);
    expect(limiter.size).toBe(0);
    expect(limiter.queued).toBe(0);
  });
});
