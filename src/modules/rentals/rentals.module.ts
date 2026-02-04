import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RentalsController } from "./rentals.controller";
import { RentalsService } from "./rentals.service";

import { Rental } from "./entities/rental.entity";
import { RentalItem } from "./entities/rental-item.entity";

import { User } from "../users/entities/user.entity";
import { Product } from "../products/entities/product.entity";
import { ProductVariant } from "../products/entities/product-variant.entity"; // ✅ ADD
import { Payment } from "../payments/entities/payment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rental,
      RentalItem,
      User,
      Product,
      ProductVariant, // ✅ ADD
      Payment,
    ]),
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
