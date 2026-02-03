import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductVariantsTable1770080356893 implements MigrationInterface {
  name = "CreateProductVariantsTable1770080356893";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        size ENUM('S','M','L','XL','XXL') NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_variant_product
          FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    // ✅ 1 product không được có 2 variant cùng size
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_product_variant_product_size
      ON product_variants(product_id, size);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_product_variant_product_id
      ON product_variants(product_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_product_variant_is_active
      ON product_variants(is_active);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_product_variant_is_active ON product_variants;`);
    await queryRunner.query(`DROP INDEX idx_product_variant_product_id ON product_variants;`);
    await queryRunner.query(`DROP INDEX uq_product_variant_product_size ON product_variants;`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_variants;`);
  }
}
