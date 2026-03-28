import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveReservedFromInventory1770080356897 implements MigrationInterface {
  name = "RemoveReservedFromInventory1770080356897";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Chuyển các item đang reserved → available trước khi đổi enum
    await queryRunner.query(`
      UPDATE inventory_items SET condition_status = 'available'
      WHERE condition_status = 'reserved'
    `);

    // Alter enum bỏ 'reserved'
    await queryRunner.query(`
      ALTER TABLE inventory_items
      MODIFY COLUMN condition_status
      ENUM('available','shipping','rented','returned','washing','repairing','retired')
      NOT NULL DEFAULT 'available'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE inventory_items
      MODIFY COLUMN condition_status
      ENUM('available','reserved','shipping','rented','returned','washing','repairing','retired')
      NOT NULL DEFAULT 'available'
    `);
  }
}
