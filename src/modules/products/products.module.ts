import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { Category } from "../categories/entities/category.entity";

import { ProductController } from "./products.controller";
import { ProductService } from "./products.service";

import { CloudinaryModule } from "../../common/cloudinary/cloudinary.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, Category]),
    CloudinaryModule,
    InventoryModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
