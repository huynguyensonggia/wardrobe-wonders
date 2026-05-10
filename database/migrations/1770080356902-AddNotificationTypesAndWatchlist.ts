import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationTypesAndWatchlist1770080356902 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alter notifications.type enum to add new types
    await queryRunner.query(`
      ALTER TABLE notifications
      MODIFY COLUMN type ENUM(
        'RENTAL_CREATED',
        'RENTAL_APPROVED',
        'RENTAL_REJECTED',
        'RENTAL_COMPLETED',
        'RENTAL_CANCELLED',
        'RENTAL_SHIPPING',
        'RENTAL_ACTIVE',
        'RETURN_REMINDER',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'REFUND_SUCCESS',
        'STOCK_AVAILABLE',
        'SYSTEM'
      ) NOT NULL
    `);

    // Create product_watchlist table
    await queryRunner.query(`
      CREATE TABLE product_watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_watchlist_user_product (user_id, product_id),
        CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_watchlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_watchlist`);

    await queryRunner.query(`
      ALTER TABLE notifications
      MODIFY COLUMN type ENUM(
        'RENTAL_CREATED',
        'RENTAL_APPROVED',
        'RENTAL_REJECTED',
        'RENTAL_COMPLETED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'REFUND_SUCCESS',
        'SYSTEM'
      ) NOT NULL
    `);
  }
}
