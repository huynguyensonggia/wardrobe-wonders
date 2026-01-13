import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from "typeorm";

import { Category } from "../../categories/entities/category.entity";
import { Review } from "../../reviews/entities/review.entity";
import { RentalItem } from "../../rentals/entities/rental-item.entity";

import { ProductStatus } from "../enums/product-status.enum";
import { ProductSize } from "../enums/product-size.enum";
import { ProductType } from "../enums/product-type.enum";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== BASIC INFO =====
  @Column({ name: "name", length: 150 })
  name: string;

  // ===== CATEGORY =====
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category: Category;

  @RelationId((product: Product) => product.category)
  categoryId: number;

  // ===== PRODUCT ATTRIBUTES =====
  @Column({
    name: "type",
    type: "enum",
    enum: ProductType,
  })
  type: ProductType;

  @Column({ name: "rent_price_per_day", type: "int" })
  rentPricePerDay: number;

  @Column({ name: "deposit", type: "int" })
  deposit: number;

  @Column({
    name: "size",
    type: "enum",
    enum: ProductSize,
    default: ProductSize.M,
  })
  size: ProductSize;

  @Column({ name: "color", length: 30, default: "unknown" })
  color: string;

  @Column({ name: "quantity", type: "int", default: 1 })
  quantity: number;

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
