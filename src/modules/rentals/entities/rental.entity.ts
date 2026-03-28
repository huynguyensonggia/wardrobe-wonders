import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
  Index,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { RentalItem } from "./rental-item.entity";
import { Payment } from "../../payments/entities/payment.entity";
import { RentalSurcharge } from "./rental-surcharge.entity";
import { RentalStatus } from "../enums/rental-status.enum";

export enum PickupType {
  DELIVERY = "delivery",
  STORE = "store",
}

@Entity("rentals")
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ ADD: rental_code (UNIQUE)
  @Index({ unique: true })
  @Column({ name: "rental_code", type: "varchar", length: 50, unique: true })
  rentalCode: string;

  @BeforeInsert()
  private genRentalCode() {
    // nếu chưa set từ service thì tự sinh
    if (!this.rentalCode) {
      this.rentalCode = `RENT-${Date.now()}`;
    }
  }

  // ===== RELATIONS =====
  @ManyToOne(() => User, (user) => user.rentals, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => RentalItem, (item) => item.rental, { cascade: true })
  items: RentalItem[];

  @OneToMany(() => Payment, (payment) => payment.rental, { cascade: true })
  payments: Payment[];

  @OneToMany(() => RentalSurcharge, (s) => s.rental, { cascade: true })
  surcharges: RentalSurcharge[];

  // ===== BUSINESS =====
  @Column({ type: "date", name: "start_date" })
  startDate: Date;

  @Column({ type: "date", name: "end_date" })
  endDate: Date;

  @Column({ type: "int", name: "total_days", default: 0 })
  totalDays: number;

  @Column({ type: "int", name: "total_price", default: 0 })
  totalPrice: number;

  @Column({ type: "int", name: "total_deposit", default: 0 })
  totalDeposit: number;

  @Column({ type: "enum", enum: RentalStatus, default: RentalStatus.PENDING })
  status: RentalStatus;

  @Column({ type: "text", nullable: true })
  note?: string;

  // =========================
  // ✅ SHIPPING INFO (NEW)
  // =========================

  @Column({ name: "ship_full_name", type: "varchar", length: 120, nullable: true })
  shipFullName?: string;

  @Column({ name: "ship_phone", type: "varchar", length: 30, nullable: true })
  shipPhone?: string;

  @Column({ name: "ship_address", type: "varchar", length: 255 })
  shipAddress: string;

  @Column({ name: "ship_note", type: "varchar", length: 255, nullable: true })
  shipNote?: string;

  @Column({ name: "pickup_type", type: "enum", enum: PickupType, default: PickupType.DELIVERY })
  pickupType: PickupType;

  @Column({ name: "actual_return_date", type: "date", nullable: true })
  actualReturnDate?: Date;

  // ===== TIMESTAMPS =====
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
