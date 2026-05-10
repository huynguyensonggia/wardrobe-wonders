import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductWatchlist } from "./entities/product-watchlist.entity";
import { Category } from "../categories/entities/category.entity";

import { ProductController } from "./products.controller";
import { ProductService } from "./products.service";
import { WatchlistService } from "./watchlist.service";

import { CloudinaryModule } from "../../common/cloudinary/cloudinary.module";
import { InventoryModule } from "../inventory/inventory.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, Category, ProductWatchlist]),
    CloudinaryModule,
    InventoryModule,
    NotificationsModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, WatchlistService],
  exports: [ProductService, WatchlistService],
})
export class ProductsModule {}
