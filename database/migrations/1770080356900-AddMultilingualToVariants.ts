import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultilingualToVariants1770080356900 implements MigrationInterface {
  name = "AddMultilingualToVariants1770080356900";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_variants
        ADD COLUMN size_en VARCHAR(50) NULL AFTER size,
        ADD COLUMN size_ja VARCHAR(50) NULL AFTER size_en
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_variants
        DROP COLUMN size_en,
        DROP COLUMN size_ja
    `);
  }
}
