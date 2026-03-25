import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterVariantSizeToVarchar1770080356894 implements MigrationInterface {
  name = "AlterVariantSizeToVarchar1770080356894";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique index (dùng tên đúng từ DB)
    await queryRunner.query(`DROP INDEX IF EXISTS uq_product_variant_product_size ON product_variants`);

    // 2. Drop FK trước khi alter column
    await queryRunner.query(`ALTER TABLE product_variants DROP FOREIGN KEY fk_variant_product`);

    // 3. Alter column size từ ENUM sang VARCHAR
    await queryRunner.query(`ALTER TABLE product_variants MODIFY COLUMN size VARCHAR(20) NOT NULL`);

    // 4. Recreate FK
    await queryRunner.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT fk_variant_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 5. Recreate unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_product_variant_product_size
      ON product_variants(product_id, size)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_product_variant_product_size ON product_variants`);
    await queryRunner.query(`ALTER TABLE product_variants DROP FOREIGN KEY fk_variant_product`);
    await queryRunner.query(`ALTER TABLE product_variants MODIFY COLUMN size ENUM('S','M','L','XL','XXL') NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT fk_variant_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_product_variant_product_size
      ON product_variants(product_id, size)
    `);
  }
}
