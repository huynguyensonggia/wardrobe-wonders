import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from "typeorm";
import { Rental } from "./rental.entity";

export enum SurchargeType {
  LATE_RETURN = "late_return",
  DAMAGE = "damage",
  CLEANING = "cleaning",
  EXPRESS_DELIVERY = "express_delivery",
  OTHER = "other",
}

@Entity("rental_surcharges")
export class RentalSurcharge {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rental, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "rental_id" })
  rental: Rental;

  @Column({ type: "enum", enum: SurchargeType })
  type: SurchargeType;

  @Column({ type: "int" })
  amount: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  note?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
