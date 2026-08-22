import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSchema1710000000001 implements MigrationInterface {
  name = 'CreateUserSchema1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "firstName" varchar(80) NOT NULL,
        "lastName" varchar(80) NOT NULL,
        "phone" varchar(32),
        "bio" varchar(500),
        "avatar" varchar(500),
        "dateOfBirth" date,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_profiles_userId" ON "user_profiles" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_profiles_email" ON "user_profiles" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_profiles"');
  }
}
