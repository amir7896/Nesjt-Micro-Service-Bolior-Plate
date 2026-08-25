import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatSchema1730000000000 implements MigrationInterface {
  name = 'CreateChatSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "conversations_type_enum" AS ENUM ('private', 'group')`,
    );
    await queryRunner.query(
      `CREATE TYPE "conversation_members_role_enum" AS ENUM ('owner', 'admin', 'member')`,
    );
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "conversations_type_enum" NOT NULL,
        "name" varchar(120),
        "createdBy" uuid NOT NULL,
        "pairKey" varchar(80),
        "lastMessageAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_conversations_pairKey_active" ON "conversations" ("pairKey") WHERE "deletedAt" IS NULL AND "pairKey" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_lastMessageAt" ON "conversations" ("lastMessageAt")`,
    );
    await queryRunner.query(`
      CREATE TABLE "conversation_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "conversation_members_role_enum" NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "leftAt" TIMESTAMPTZ,
        CONSTRAINT "PK_conversation_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversation_members_conversation"
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_conversation_members_active" ON "conversation_members" ("conversationId", "userId") WHERE "leftAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversation_members_userId" ON "conversation_members" ("userId")`,
    );
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversationId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "body" varchar(4000) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation"
          FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversationId" ON "messages" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_senderId" ON "messages" ("senderId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "messages"');
    await queryRunner.query('DROP TABLE "conversation_members"');
    await queryRunner.query('DROP TABLE "conversations"');
    await queryRunner.query('DROP TYPE "conversation_members_role_enum"');
    await queryRunner.query('DROP TYPE "conversations_type_enum"');
  }
}
