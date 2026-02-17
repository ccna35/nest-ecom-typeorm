import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1771319233836 implements MigrationInterface {
    name = 'Auto1771319233836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "seller_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "storeName" character varying(255) NOT NULL, "storeDescription" text NOT NULL, "logoUrl" character varying(500), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_49de7dde25d76b120677be9aed" UNIQUE ("userId"), CONSTRAINT "PK_13845670b88adfde01026410969" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_49de7dde25d76b120677be9aed" ON "seller_profiles" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."seller_applications_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "seller_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "storeName" character varying(255) NOT NULL, "storeDescription" text NOT NULL, "status" "public"."seller_applications_status_enum" NOT NULL DEFAULT 'pending', "rejectionReason" text, "reviewedById" uuid, "reviewedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_203be9b9b1f8ff560e8af1f90a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bc16b54496faa4ffae868a999c" ON "seller_applications" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c6b7afed8e0d1698bfdd8e6bb" ON "seller_applications" ("status") `);
        await queryRunner.query(`ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_49de7dde25d76b120677be9aedd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seller_applications" ADD CONSTRAINT "FK_bc16b54496faa4ffae868a999ce" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seller_applications" ADD CONSTRAINT "FK_7c42b24cc2b0d31522da8980ae1" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seller_applications" DROP CONSTRAINT "FK_7c42b24cc2b0d31522da8980ae1"`);
        await queryRunner.query(`ALTER TABLE "seller_applications" DROP CONSTRAINT "FK_bc16b54496faa4ffae868a999ce"`);
        await queryRunner.query(`ALTER TABLE "seller_profiles" DROP CONSTRAINT "FK_49de7dde25d76b120677be9aedd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c6b7afed8e0d1698bfdd8e6bb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc16b54496faa4ffae868a999c"`);
        await queryRunner.query(`DROP TABLE "seller_applications"`);
        await queryRunner.query(`DROP TYPE "public"."seller_applications_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49de7dde25d76b120677be9aed"`);
        await queryRunner.query(`DROP TABLE "seller_profiles"`);
    }

}
