import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryItem } from "./entities/inventory-item.entity";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { ProductVariant } from "../products/entities/product-variant.entity";

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, ProductVariant])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
