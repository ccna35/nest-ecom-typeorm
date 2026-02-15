import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1779999999999 implements MigrationInterface {
    name = 'AddRefreshTokens1779999999999';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMPTZ NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "revokedAt" TIMESTAMPTZ, CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_tokenHash" ON "refresh_tokens" ("tokenHash")`,
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_refresh_tokens_tokenHash"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_refresh_tokens_userId"`,
        );
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
