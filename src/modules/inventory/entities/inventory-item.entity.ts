import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from "typeorm";
import { ProductVariant } from "../../products/entities/product-variant.entity";

export enum ConditionStatus {
  AVAILABLE  = "available",
  SHIPPING   = "shipping",
  RENTED     = "rented",
  RETURNED   = "returned",
  WASHING    = "washing",
  REPAIRING  = "repairing",
  RETIRED    = "retired",
}

@Entity("inventory_items")
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "variant_id", type: "int" })
  variantId: number;

  @ManyToOne(() => ProductVariant, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "variant_id" })
  variant: ProductVariant;

  @Column({ type: "varchar", length: 100, unique: true })
  barcode: string;

  @Column({
    name: "condition_status",
    type: "enum",
    enum: ConditionStatus,
    default: ConditionStatus.AVAILABLE,
  })
  conditionStatus: ConditionStatus;

  @Column({ name: "total_rentals", type: "int", default: 0 })
  totalRentals: number;

  @Column({ name: "max_rentals", type: "int", default: 50 })
  maxRentals: number;

  @Column({ name: "condition_note", type: "varchar", length: 500, nullable: true })
  conditionNote?: string;

  @Column({ name: "acquired_date", type: "date", nullable: true })
  acquiredDate?: Date;

  @Column({ name: "retired_date", type: "date", nullable: true })
  retiredDate?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
