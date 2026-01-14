import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1768016776700 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,

        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(20) NULL,

        password VARCHAR(255) NOT NULL,

        role ENUM('USER','ADMIN','STAFF') NOT NULL DEFAULT 'USER',
        is_active TINYINT(1) NOT NULL DEFAULT 1,

        email_verified_at DATETIME NULL,
        last_login_at DATETIME NULL,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS users;
    `);
  }
}
