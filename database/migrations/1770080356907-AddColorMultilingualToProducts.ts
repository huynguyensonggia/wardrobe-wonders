import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColorMultilingualToProducts1770080356907
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN color_en VARCHAR(50) NULL AFTER color,
        ADD COLUMN color_ja VARCHAR(50) NULL AFTER color_en
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        DROP COLUMN color_en,
        DROP COLUMN color_ja
    `);
  }
}
