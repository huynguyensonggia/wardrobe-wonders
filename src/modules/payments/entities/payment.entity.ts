// src/modules/payments/entities/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Rental } from "../../rentals/entities/rental.entity";
import { User } from "../../users/entities/user.entity";
import { PaymentMethod } from "../enums/payment-method.enum";
import { PaymentStatus } from "../enums/payment-status.enum";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rental, (rental) => rental.payments, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "rental_id" })
  rental: Rental;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "int" })
  amount: number;

  @Column({
    type: "enum",
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Thêm name: "transaction_code" để khớp migration
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    name: "transaction_code",
  })
  transactionCode?: string;

  // Thêm name: "paid_at"
  @Column({ type: "datetime", nullable: true, name: "paid_at" })
  paidAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
