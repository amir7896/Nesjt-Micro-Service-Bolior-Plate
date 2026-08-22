import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  const redis = {
    set: jest.fn(),
    exists: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue('1d'),
  };

  const service = new TokenBlacklistService(
    redis as never,
    config as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('1d');
  });

  it('stores a hashed token with the access-token TTL', async () => {
    await service.revokeAccessToken('access-token');

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^gateway:token:blacklist:[a-f0-9]{64}$/),
      '1',
      'EX',
      24 * 60 * 60,
    );
  });

  it('reports whether a token is revoked', async () => {
    redis.exists.mockResolvedValue(1);
    await expect(service.isRevoked('access-token')).resolves.toBe(true);

    redis.exists.mockResolvedValue(0);
    await expect(service.isRevoked('access-token')).resolves.toBe(false);
  });
});
