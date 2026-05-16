import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleIdToUsers1770080356904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN google_id VARCHAR(100) NULL UNIQUE AFTER email,
        MODIFY COLUMN password VARCHAR(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN google_id,
        MODIFY COLUMN password VARCHAR(255) NOT NULL
    `);
  }
}
