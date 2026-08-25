import { privatePairKey } from './chat.service';

describe('privatePairKey', () => {
  it('sorts user ids so either order produces the same key', () => {
    const a = '11111111-1111-4111-8111-111111111111';
    const b = '22222222-2222-4222-8222-222222222222';
    expect(privatePairKey(a, b)).toBe(privatePairKey(b, a));
    expect(privatePairKey(a, b)).toContain(a);
    expect(privatePairKey(a, b)).toContain(b);
  });
});
