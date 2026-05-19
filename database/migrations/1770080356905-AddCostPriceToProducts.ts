import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCostPriceToProducts1770080356905 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN cost_price INT NOT NULL DEFAULT 0 AFTER name_ja
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products DROP COLUMN cost_price
    `);
  }
}
