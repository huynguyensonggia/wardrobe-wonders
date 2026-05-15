import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReturnedStatusToRentals1770080356903 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE rentals
      MODIFY COLUMN status ENUM(
        'pending',
        'shipping',
        'active',
        'completed',
        'rejected',
        'cancelled',
        'returned'
      ) NOT NULL DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE rentals
      MODIFY COLUMN status ENUM(
        'pending',
        'shipping',
        'active',
        'completed',
        'rejected',
        'cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);
  }
}
