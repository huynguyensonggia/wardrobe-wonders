import { Module } from "@nestjs/common";
import EnvConfig from "../bootstrap/env";
import DatabaseConfig from "../bootstrap/database";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TryonModule } from "./modules/tryon/tryon.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AdminModule } from "./modules/admin/admin.module";
import { RentalsModule } from "./modules/rentals/rentals.module"

@Module({
  imports: [
    EnvConfig(),
    DatabaseConfig(),

    ProductsModule,
    CategoriesModule,
    TryonModule,
    AuthModule,
    UsersModule,
    AdminModule,
    RentalsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
