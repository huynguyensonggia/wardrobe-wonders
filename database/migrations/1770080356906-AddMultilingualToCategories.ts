import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultilingualToCategories1770080356906
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE categories
        ADD COLUMN name_en VARCHAR(100) NULL AFTER name,
        ADD COLUMN name_ja VARCHAR(100) NULL AFTER name_en
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE categories
        DROP COLUMN name_en,
        DROP COLUMN name_ja
    `);
  }
}
