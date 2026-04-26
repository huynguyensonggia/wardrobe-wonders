import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultilingualToProducts1770080356898 implements MigrationInterface {
  name = "AddMultilingualToProducts1770080356898";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN name_en VARCHAR(150) NULL AFTER name,
        ADD COLUMN name_ja VARCHAR(150) NULL AFTER name_en,
        ADD COLUMN description_en TEXT NULL AFTER description,
        ADD COLUMN description_ja TEXT NULL AFTER description_en
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        DROP COLUMN name_en,
        DROP COLUMN name_ja,
        DROP COLUMN description_en,
        DROP COLUMN description_ja
    `);
  }
}
