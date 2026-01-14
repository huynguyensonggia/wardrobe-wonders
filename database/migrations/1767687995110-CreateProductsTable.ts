import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1767687995110 implements MigrationInterface {
  name = "CreateProductsTable1767687995110";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category_id INT NOT NULL,
        occasion ENUM('party','wedding','casual') NOT NULL,
        rent_price_per_day INT NOT NULL,
        deposit INT NOT NULL,
        size ENUM('XS','S','M','L','XL') NOT NULL DEFAULT 'M',
        color VARCHAR(30) NOT NULL DEFAULT 'unknown',
        quantity INT NOT NULL DEFAULT 1,
        image_url VARCHAR(255) NULL,
        description TEXT NULL,
        status ENUM('available','rented','maintenance') NOT NULL DEFAULT 'available',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_product_category
          FOREIGN KEY (category_id)
          REFERENCES categories(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_product_category_id ON products(category_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_product_status ON products(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_product_status ON products;`);
    await queryRunner.query(`DROP INDEX idx_product_category_id ON products;`);
    await queryRunner.query(`DROP TABLE IF EXISTS products;`);
  }
}
