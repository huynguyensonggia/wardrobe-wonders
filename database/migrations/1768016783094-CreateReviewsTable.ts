import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewsTable1768016783094 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,

        user_id INT NOT NULL,
        product_id INT NOT NULL,
        rental_id INT NULL,

        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NULL,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_reviews_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_reviews_product
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_reviews_rental
          FOREIGN KEY (rental_id) REFERENCES rentals(id)
          ON DELETE SET NULL,

        CONSTRAINT uq_user_product_review
          UNIQUE (user_id, product_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reviews_product_id
      ON reviews(product_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reviews_user_id
      ON reviews(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS reviews;
    `);
  }
}
