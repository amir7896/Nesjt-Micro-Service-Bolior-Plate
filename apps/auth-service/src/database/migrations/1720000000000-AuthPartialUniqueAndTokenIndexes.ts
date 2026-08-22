import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthPartialUniqueAndTokenIndexes1720000000000 implements MigrationInterface {
  name = 'AuthPartialUniqueAndTokenIndexes1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_active" ON "users" ("email") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_userId_revoked" ON "refresh_tokens" ("userId", "revoked")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_expiresAt" ON "refresh_tokens" ("expiresAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_expiresAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_userId_revoked"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_active"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    );
  }
}
