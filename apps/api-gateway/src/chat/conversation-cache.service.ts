import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@app/common';

const MEMBER_TTL_SECONDS = 60;

@Injectable()
export class ConversationCacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getMemberIds(conversationId: string): Promise<string[] | null> {
    const members = await this.redis.smembers(this.key(conversationId));
    return members.length > 0 ? members : null;
  }

  async setMemberIds(
    conversationId: string,
    memberIds: string[],
  ): Promise<void> {
    const key = this.key(conversationId);
    const pipeline = this.redis.pipeline();
    pipeline.del(key);
    if (memberIds.length > 0) {
      pipeline.sadd(key, ...memberIds);
      pipeline.expire(key, MEMBER_TTL_SECONDS);
    }
    await pipeline.exec();
  }

  async invalidate(conversationId: string): Promise<void> {
    await this.redis.del(this.key(conversationId));
  }

  private key(conversationId: string): string {
    return `chat:cache:members:${conversationId}`;
  }
}
