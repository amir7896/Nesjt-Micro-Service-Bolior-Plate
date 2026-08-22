import { hashPassword, verifyPassword } from './hash.util';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hashed = await hashPassword('Str0ng!Pass');
    await expect(verifyPassword('Str0ng!Pass', hashed)).resolves.toBe(true);
    await expect(verifyPassword('wrong-pass', hashed)).resolves.toBe(false);
  });
});
