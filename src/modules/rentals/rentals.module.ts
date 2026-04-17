import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RentalsController } from "./rentals.controller";
import { RentalsService } from "./rentals.service";

import { Rental } from "./entities/rental.entity";
import { RentalItem } from "./entities/rental-item.entity";
import { RentalSurcharge } from "./entities/rental-surcharge.entity";

import { User } from "../users/entities/user.entity";
import { Product } from "../products/entities/product.entity";
import { ProductVariant } from "../products/entities/product-variant.entity";
import { Payment } from "../payments/entities/payment.entity";
import { InventoryModule } from "../inventory/inventory.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rental, RentalItem, RentalSurcharge,
      User, Product, ProductVariant, Payment,
    ]),
    InventoryModule,
    MailModule,
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
