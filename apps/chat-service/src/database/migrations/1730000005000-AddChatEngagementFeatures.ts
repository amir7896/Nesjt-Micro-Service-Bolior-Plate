import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatEngagementFeatures1730000005000
  implements MigrationInterface
{
  name = 'AddChatEngagementFeatures1730000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "messages_type_enum" ADD VALUE IF NOT EXISTS 'image'`,
    );
    await queryRunner.query(
      `ALTER TYPE "messages_type_enum" ADD VALUE IF NOT EXISTS 'file'`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachmentUrl" varchar(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachmentMime" varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachmentName" varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachmentSize" int`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "forwardedFromMessageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_members" ADD COLUMN IF NOT EXISTS "pinnedAt" TIMESTAMPTZ`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "message_reactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "messageId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "emoji" varchar(16) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_message_reactions_message_user_emoji"
          UNIQUE ("messageId", "userId", "emoji"),
        CONSTRAINT "FK_message_reactions_messageId"
          FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_reactions_messageId" ON "message_reactions" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_reactions_userId" ON "message_reactions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_conversation_members_pinnedAt" ON "conversation_members" ("userId", "pinnedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_conversation_members_pinnedAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "message_reactions"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_members" DROP COLUMN IF EXISTS "pinnedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "forwardedFromMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "attachmentSize"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "attachmentName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "attachmentMime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "attachmentUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN IF EXISTS "editedAt"`,
    );
  }
}
