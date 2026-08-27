import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShowLastSeenPrivacy1730000004000 implements MigrationInterface {
  name = 'AddShowLastSeenPrivacy1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "showLastSeen" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "showLastSeen"`,
    );
  }
}
