declare module '@keyv/redis' {
  class KeyvRedis {
    constructor(uri?: string, options?: Record<string, unknown>);
  }

  export function createKeyv(
    uri?: string,
    options?: Record<string, unknown>,
  ): unknown;
  export default KeyvRedis;
}
