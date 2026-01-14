import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRentalsTable1768016779243 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rentals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rental_code VARCHAR(50) NOT NULL UNIQUE,

        status ENUM(
          'pending',
          'confirmed',
          'renting',
          'returned',
          'cancelled'
        ) NOT NULL DEFAULT 'pending',

        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        total_price INT NOT NULL,
        total_deposit INT NOT NULL DEFAULT 0,
        note TEXT NULL,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_rentals_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_rentals_user_id ON rentals(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS rentals;
    `);
  }
}
