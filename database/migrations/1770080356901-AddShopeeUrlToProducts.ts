import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShopeeUrlToProducts1770080356901 implements MigrationInterface {
  name = "AddShopeeUrlToProducts1770080356901";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN shopee_url VARCHAR(500) NULL AFTER image_url
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN shopee_url
    `);
  }
}
