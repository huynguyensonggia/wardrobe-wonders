import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Rental } from "./rental.entity";
import { Product } from "../../products/entities/product.entity";
import { ProductVariant } from "@/modules/products/entities/product-variant.entity";

@Entity("rental_items")
@Index(["rental", "variantId"], { unique: true }) // tránh trùng same variant trong 1 rental
export class RentalItem {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== RELATIONS =====
  @ManyToOne(() => Rental, (rental) => rental.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "rental_id" })
  rental: Rental;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: "product_id" })
  product: Product;

  // ✅ NEW: VARIANT (size)
  @Column({ name: "variant_id", type: "int" })
  variantId: number;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "variant_id" })
  variant: ProductVariant;

  // ===== SNAPSHOT =====
  @Column({ name: "rent_price_per_day", type: "int" })
  rentPricePerDay: number;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column({ type: "int" })
  days: number;

  @Column({ type: "int" })
  subtotal: number;
}
