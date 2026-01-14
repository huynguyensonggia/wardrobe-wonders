import { Module } from "@nestjs/common";
import { AdminProductsController } from "./admin-products.controller";
import { AdminCategoriesController } from "./admin-categories.controller";
import { ProductsModule } from "../products/products.module"; // import nếu cần share service
import { CategoriesModule } from "../categories/categories.module"; // import nếu cần

@Module({
  imports: [
    ProductsModule, // share service nếu có
    CategoriesModule,
  ],
  controllers: [AdminProductsController, AdminCategoriesController],
  // providers: [] // nếu cần service riêng cho admin
})
export class AdminModule {}
