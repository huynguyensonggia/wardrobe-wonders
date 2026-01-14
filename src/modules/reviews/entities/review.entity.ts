import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { Product } from "../../products/entities/product.entity";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== RELATIONS =====
  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product: Product;

  // ===== REVIEW CONTENT =====
  @Column({ type: "tinyint", unsigned: true })
  rating: number; // 1 → 5

  @Column({ type: "text", nullable: true })
  comment?: string;

  // ===== TIMESTAMPS =====
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
