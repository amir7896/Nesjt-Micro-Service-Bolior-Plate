import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPartialUniqueUserId1720000000001 implements MigrationInterface {
  name = 'UserPartialUniqueUserId1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_profiles_userId"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_profiles_userId_active" ON "user_profiles" ("userId") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_user_profiles_userId_active"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_profiles_userId" ON "user_profiles" ("userId")`,
    );
  }
}
