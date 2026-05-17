import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRentalSurchargesTable1770080356908 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rental_surcharges (
        id INT NOT NULL AUTO_INCREMENT,
        type ENUM('late_return','damage','cleaning','express_delivery','other') NOT NULL,
        amount INT NOT NULL,
        note VARCHAR(500) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        rental_id INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_surcharge_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS rental_surcharges`);
  }
}
