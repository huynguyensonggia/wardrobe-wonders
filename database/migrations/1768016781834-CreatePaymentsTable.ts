import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentsTable1768016781834 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,

        rental_id INT NOT NULL,
        user_id INT NOT NULL,

        amount INT NOT NULL,
        method ENUM('CASH','BANK_TRANSFER', 'COD') NOT NULL,
        status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',

        transaction_code VARCHAR(255) NULL,
        paid_at DATETIME NULL,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_payments_rental
          FOREIGN KEY (rental_id) REFERENCES rentals(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_payments_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_payments_rental_id
      ON payments(rental_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_payments_user_id
      ON payments(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS payments;
    `);
  }

}
