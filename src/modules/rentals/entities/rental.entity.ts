import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";

import { User } from "../../users/entities/user.entity";
import { RentalItem } from "./rental-item.entity";
import { Payment } from "../../payments/entities/payment.entity";
import { RentalStatus } from "../enums/rental-status.enum";

@Entity("rentals")
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== RELATIONS =====

  @ManyToOne(() => User, (user) => user.rentals, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" }) // ✅ snake_case DB
  user: User;

  @OneToMany(() => RentalItem, (item) => item.rental, {
    cascade: true,
  })
  items: RentalItem[];

  @OneToMany(() => Payment, (payment) => payment.rental, {
    cascade: true,
  })
  payments: Payment[];

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

  @Column({
    type: "enum",
    enum: RentalStatus,
    default: RentalStatus.PENDING,
  })
  status: RentalStatus;

  @Column({ type: "text", nullable: true })
  note?: string;

  // ===== TIMESTAMPS =====

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
