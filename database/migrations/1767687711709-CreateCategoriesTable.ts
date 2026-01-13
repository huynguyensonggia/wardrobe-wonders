import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1767687711709 implements MigrationInterface {
  name = "CreateCategoriesTable1767687711709";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,

        -- ✅ NEW: map cho FitDiT (Áo/Quần/Váy-Đầm)
        vton_category ENUM('Upper-body','Lower-body','Dresses') NOT NULL DEFAULT 'Dresses',

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ✅ đúng bảng
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
  }
}
