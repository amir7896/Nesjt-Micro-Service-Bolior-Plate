import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatScaleIndexes1730000002000 implements MigrationInterface {
  name = 'AddChatScaleIndexes1730000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_messages_conversation_created"
      ON "messages" ("conversationId", "createdAt" DESC)
      WHERE "deletedAt" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_members_unread"
      ON "conversation_members" ("conversationId", "userId", "lastReadAt")
      WHERE "leftAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_conversation_members_unread"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_messages_conversation_created"`);
  }
}
