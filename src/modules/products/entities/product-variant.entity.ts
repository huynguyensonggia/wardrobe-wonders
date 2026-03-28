import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Product } from "@/modules/products/entities/product.entity";

@Entity({ name: "product_variants" })
@Index(["productId", "size"], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ FK column trong DB là product_id
  @Column({ name: "product_id", type: "int" })
  productId: number;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column({
    name: "size",
    type: "varchar",
    length: 20,
  })
  size: string;

  @Column({ name: "stock", type: "int", default: 0 })
  stock: number;

  @Column({ name: "buffer_days", type: "int", default: 1 })
  bufferDays: number;

  @Column({ name: "is_active", type: "tinyint", width: 1, default: 1 })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt: Date;
}
