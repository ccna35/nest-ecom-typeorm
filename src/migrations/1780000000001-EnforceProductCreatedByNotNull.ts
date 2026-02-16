import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceProductCreatedByNotNull1780000000001 implements MigrationInterface {
    name = 'EnforceProductCreatedByNotNull1780000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "products" ADD CONSTRAINT "CHK_products_createdById_not_null" CHECK ("createdById" IS NOT NULL) NOT VALID`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "products" DROP CONSTRAINT "CHK_products_createdById_not_null"`,
        );
    }
}
