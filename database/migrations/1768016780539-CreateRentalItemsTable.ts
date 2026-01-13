import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRentalItemsTable1768016780539
  implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rental_items (
        id INT AUTO_INCREMENT PRIMARY KEY,

        rental_id INT NOT NULL,
        product_id INT NOT NULL,

        rent_price_per_day INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        days INT NOT NULL,
        subtotal INT NOT NULL,

        CONSTRAINT fk_rental_items_rental
          FOREIGN KEY (rental_id)
          REFERENCES rentals(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_rental_items_product
          FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_rental_items_rental_id
      ON rental_items(rental_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_rental_items_product_id
      ON rental_items(product_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS rental_items;
    `);
  }
}
