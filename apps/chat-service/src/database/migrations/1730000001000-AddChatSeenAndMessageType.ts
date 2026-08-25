import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatSeenAndMessageType1730000001000
  implements MigrationInterface
{
  name = 'AddChatSeenAndMessageType1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversation_members" ADD COLUMN "lastReadAt" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `CREATE TYPE "messages_type_enum" AS ENUM ('text')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "type" "messages_type_enum" NOT NULL DEFAULT 'text'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "messages_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_members" DROP COLUMN "lastReadAt"`,
    );
  }
}
