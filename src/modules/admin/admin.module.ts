import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminProductsController } from "./admin-products.controller";
import { AdminCategoriesController } from "./admin-categories.controller";
import { AdminRentalsController } from "./admin-rentals.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminStatsController } from "./admin-stats.controller";

import { AdminService } from "./admin.service";

import { ProductsModule } from "../products/products.module";
import { CategoriesModule } from "../categories/categories.module";
import { RentalsModule } from "../rentals/rentals.module";
import { UsersModule } from "../users/users.module";

// ✅ entities để inject repository cho AdminService
import { Product } from "../products/entities/product.entity";
import { User } from "../users/entities/user.entity";
import { Rental } from "../rentals/entities/rental.entity";

@Module({
  imports: [
    // ✅ cho AdminService (repo)
    TypeOrmModule.forFeature([Product, User, Rental]),

    // ✅ cho AdminProductsController/AdminUsersController/... (service)
    ProductsModule,
    CategoriesModule,
    RentalsModule,
    UsersModule,
  ],
  controllers: [
    AdminProductsController,
    AdminCategoriesController,
    AdminRentalsController,
    AdminUsersController,
    AdminStatsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
