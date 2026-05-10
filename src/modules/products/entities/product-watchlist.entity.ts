import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Column,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Product } from "./product.entity";

@Entity("product_watchlist")
@Unique(["userId", "productId"])
export class ProductWatchlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  userId: number;

  @Column({ name: "product_id" })
  productId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
