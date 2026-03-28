import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryItemsTable1770080356896 implements MigrationInterface {
  name = "CreateInventoryItemsTable1770080356896";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,

        -- Liên kết tới variant (product + size)
        variant_id INT NOT NULL,

        -- Barcode duy nhất cho từng món vật lý
        barcode VARCHAR(100) NOT NULL UNIQUE,

        -- Trạng thái vòng đời
        condition_status ENUM(
          'available',
          'reserved',
          'shipping',
          'rented',
          'returned',
          'washing',
          'repairing',
          'retired'
        ) NOT NULL DEFAULT 'available',

        -- Theo dõi hao mòn
        total_rentals INT NOT NULL DEFAULT 0,
        max_rentals INT NOT NULL DEFAULT 50,

        -- Ghi chú tình trạng
        condition_note VARCHAR(500) NULL,

        -- Ngày nhập kho
        acquired_date DATE NULL,

        -- Ngày thanh lý (nếu retired)
        retired_date DATE NULL,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_inventory_variant
          FOREIGN KEY (variant_id)
          REFERENCES product_variants(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_inventory_variant_id ON inventory_items(variant_id)`);
    await queryRunner.query(`CREATE INDEX idx_inventory_status ON inventory_items(condition_status)`);

    // Thêm cột inventory_item_id vào rental_items để track món đồ cụ thể
    await queryRunner.query(`
      ALTER TABLE rental_items
      ADD COLUMN inventory_item_id INT NULL,
      ADD CONSTRAINT fk_rental_item_inventory
        FOREIGN KEY (inventory_item_id)
        REFERENCES inventory_items(id)
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE rental_items DROP FOREIGN KEY fk_rental_item_inventory`);
    await queryRunner.query(`ALTER TABLE rental_items DROP COLUMN inventory_item_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_items`);
  }
}
