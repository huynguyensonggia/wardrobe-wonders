import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";

import { Category } from "../../categories/entities/category.entity";
import { Review } from "../../reviews/entities/review.entity";
import { RentalItem } from "../../rentals/entities/rental-item.entity";
import { ProductVariant } from "@/modules/products/entities/product-variant.entity";

import { ProductStatus } from "../enums/product-status.enum";
import { ProductSize } from "../enums/product-size.enum";
import { ProductOccasion } from "../enums/product-occasion.enum";

@Index(["name", "categoryId", "occasion", "color"], { unique: true })
@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== BASIC INFO =====
  @Column({ name: "name", length: 150 })
  name: string;

  @Column({ name: "name_en", type: "varchar", length: 150, nullable: true })
  nameEn: string | null;

  @Column({ name: "name_ja", type: "varchar", length: 150, nullable: true })
  nameJa: string | null;

  // ===== CATEGORY =====
  @Column({ name: "category_id", type: "int" })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category: Category;

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];

  // ===== PRODUCT ATTRIBUTES =====
  @Column({
    name: "occasion",
    type: "enum",
    enum: ProductOccasion,
  })
  occasion: ProductOccasion;

  @Column({ name: "rent_price_per_day", type: "int" })
  rentPricePerDay: number;

  @Column({ name: "deposit", type: "int" })
  deposit: number;

  @Column({ name: "color", length: 30, default: "unknown" })
  color: string;

  // ===== MEDIA =====
  @Column({
    name: "image_url",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  imageUrl: string | null;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({ name: "description_en", type: "text", nullable: true })
  descriptionEn: string | null;

  @Column({ name: "description_ja", type: "text", nullable: true })
  descriptionJa: string | null;

  // ===== STATUS =====
  @Column({
    name: "status",
    type: "enum",
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: ProductStatus;

  // ===== RELATIONS =====
  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => RentalItem, (item) => item.product)
  rentalItems: RentalItem[];

  // ===== TIMESTAMPS =====
  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
