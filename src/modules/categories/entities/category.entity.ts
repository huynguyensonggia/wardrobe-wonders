import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Product } from "../../products/entities/product.entity";
import { VtonCategory } from "../enums/vton-category.enum";

@Entity({ name: "categories" })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "name", length: 100 })
  name: string;

  @Column({ name: "slug", length: 100, unique: true })
  slug: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({
    name: "vton_category",
    type: "enum",
    enum: VtonCategory,
    default: VtonCategory.DRESSES,
  })
  vtonCategory: VtonCategory;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  // ✅ One category has many products
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
