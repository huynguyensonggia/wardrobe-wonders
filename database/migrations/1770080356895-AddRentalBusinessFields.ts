import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRentalBusinessFields1770080356895 implements MigrationInterface {
  name = "AddRentalBusinessFields1770080356895";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Thêm pickup_type vào rentals (giao tận nơi hoặc nhận tại store)
    await queryRunner.query(`
      ALTER TABLE rentals
      ADD COLUMN pickup_type ENUM('delivery', 'store') NOT NULL DEFAULT 'delivery'
      AFTER ship_note
    `);

    // 2. Thêm actual_return_date (ngày trả thực tế)
    await queryRunner.query(`
      ALTER TABLE rentals
      ADD COLUMN actual_return_date DATE NULL
      AFTER pickup_type
    `);

    // 3. Thêm buffer_days vào product_variants (số ngày giặt/kiểm tra sau khi trả)
    await queryRunner.query(`
      ALTER TABLE product_variants
      ADD COLUMN buffer_days INT NOT NULL DEFAULT 1
      AFTER stock
    `);

    // 4. Tạo bảng rental_surcharges (phí phát sinh)
    await queryRunner.query(`
      CREATE TABLE rental_surcharges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rental_id INT NOT NULL,
        type ENUM('late_return', 'damage', 'cleaning', 'express_delivery', 'other') NOT NULL,
        amount INT NOT NULL DEFAULT 0,
        note VARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_surcharge_rental
          FOREIGN KEY (rental_id) REFERENCES rentals(id)
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_surcharge_rental_id ON rental_surcharges(rental_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS rental_surcharges`);
    await queryRunner.query(`ALTER TABLE product_variants DROP COLUMN buffer_days`);
    await queryRunner.query(`ALTER TABLE rentals DROP COLUMN actual_return_date`);
    await queryRunner.query(`ALTER TABLE rentals DROP COLUMN pickup_type`);
  }
}
