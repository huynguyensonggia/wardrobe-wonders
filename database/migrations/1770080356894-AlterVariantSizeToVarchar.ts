import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterVariantSizeToVarchar1770080356894 implements MigrationInterface {
  name = "AlterVariantSizeToVarchar1770080356894";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique index nếu tồn tại (MySQL 8.0 compatible)
    await queryRunner.query(`
      SET @exist := (
        SELECT COUNT(*) FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'product_variants'
          AND index_name = 'uq_product_variant_product_size'
      );
      SET @sql := IF(@exist > 0,
        'DROP INDEX uq_product_variant_product_size ON product_variants',
        'SELECT 1'
      );
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `).catch(() => {});

    // 2. Drop FK trước khi alter column
    await queryRunner.query(`ALTER TABLE product_variants DROP FOREIGN KEY fk_variant_product`).catch(() => {});

    // 3. Alter column size từ ENUM sang VARCHAR
    await queryRunner.query(`ALTER TABLE product_variants MODIFY COLUMN size VARCHAR(20) NOT NULL`);

    // 4. Recreate FK
    await queryRunner.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT fk_variant_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `).catch(() => {});

    // 5. Recreate unique index nếu chưa có
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variant_product_size
      ON product_variants(product_id, size)
    `).catch(() => {
      // index đã tồn tại → bỏ qua
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_product_variant_product_size ON product_variants`).catch(() => {});
    await queryRunner.query(`ALTER TABLE product_variants DROP FOREIGN KEY fk_variant_product`).catch(() => {});
    await queryRunner.query(`ALTER TABLE product_variants MODIFY COLUMN size ENUM('S','M','L','XL','XXL') NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE product_variants
      ADD CONSTRAINT fk_variant_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `).catch(() => {});
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_product_variant_product_size
      ON product_variants(product_id, size)
    `).catch(() => {});
  }
}
