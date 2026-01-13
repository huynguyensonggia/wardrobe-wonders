import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Rental } from "./rental.entity";
import { Product } from "../../products/entities/product.entity";

@Entity("rental_items")
export class RentalItem {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== RELATIONS =====
  @ManyToOne(() => Rental, (rental) => rental.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "rental_id" }) // 🔥 FIX QUAN TRỌNG
  rental: Rental;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: "product_id" }) // 🔥 FIX QUAN TRỌNG
  product: Product;

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
