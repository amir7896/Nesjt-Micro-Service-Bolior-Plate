import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatProductFeatures1730000003000 implements MigrationInterface {
  name = 'AddChatProductFeatures1730000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "mutedAt" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "replyToMessageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deletedForEveryoneAt" TIMESTAMPTZ`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "messages"
          ADD CONSTRAINT "FK_messages_replyToMessageId"
          FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id")
          ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "message_hides" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_message_hides_message_user" UNIQUE ("messageId", "userId"),
        CONSTRAINT "FK_message_hides_messageId"
          FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_hides_userId" ON "message_hides" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_hides_messageId" ON "message_hides" ("messageId")`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_blocks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "blockerId" uuid NOT NULL,
        "blockedId" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_blocks_pair" UNIQUE ("blockerId", "blockedId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_blocks_blockerId" ON "user_blocks" ("blockerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_blocks_blockedId" ON "user_blocks" ("blockedId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_hides"`);
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_replyToMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "deletedForEveryoneAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "replyToMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_members" DROP COLUMN IF EXISTS "mutedAt"`,
    );
  }
}
