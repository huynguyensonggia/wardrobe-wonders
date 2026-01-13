import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1768016784345 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,

        user_id INT NOT NULL,

        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,

        type ENUM(
          'RENTAL_CREATED',
          'RENTAL_APPROVED',
          'RENTAL_REJECTED',
          'RENTAL_COMPLETED',
          'PAYMENT_SUCCESS',
          'PAYMENT_FAILED',
          'REFUND_SUCCESS',
          'SYSTEM'
        ) NOT NULL,

        is_read TINYINT(1) NOT NULL DEFAULT 0,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_notifications_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_user_id
      ON notifications(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_is_read
      ON notifications(is_read);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS notifications;
    `);
  }

}
