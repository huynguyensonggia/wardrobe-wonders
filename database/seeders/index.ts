import { AppDataSource } from "../../ormconfig";

import { seedUsers } from "./001_users_seed";
import { seedCategories } from "./002_categories_seed";
import { seedProducts } from "./003_products_seed";
import { seedRentals } from "./004_rentals_seed";
import { seedRentalItems } from "./009_rental_items_seed";
import { seedPayments } from "./006_payments_seed";
import { seedReviews } from "./007_reviews_seed";
import { seedNotifications } from "./008_notifications_seed";
import { seedProductVariants } from "./005_products_variant_seed";

async function runSeeders() {
  await AppDataSource.initialize();

  console.log(AppDataSource.options.entities);

  console.log(AppDataSource.entityMetadatas.map((e) => e.name));

  await seedUsers(AppDataSource);
  await seedCategories(AppDataSource);
  await seedProducts(AppDataSource);
  await seedRentals(AppDataSource);
  await seedRentalItems(AppDataSource);
  await seedPayments(AppDataSource);
  await seedReviews(AppDataSource);
  await seedNotifications(AppDataSource);
  await seedProductVariants(AppDataSource);

  await AppDataSource.destroy();
  console.log("✅ Seeding completed.");
}

runSeeders().catch((err) => {
  console.error("❌ Seeder error:", err);

  void AppDataSource.destroy();
});
