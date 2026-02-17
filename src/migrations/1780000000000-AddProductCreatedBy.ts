import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCreatedBy1780000000000 implements MigrationInterface {
  name = 'AddProductCreatedBy1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "createdById" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_createdById" ON "products" ("createdById")`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_createdBy"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_createdById"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "createdById"`);
  }
}
