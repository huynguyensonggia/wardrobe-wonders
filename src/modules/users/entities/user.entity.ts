import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Role } from "../../../common/enums/role.enum";
import { Rental } from "../../rentals/entities/rental.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Notification } from "../../notifications/entities/notification.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== BASIC INFO =====
  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  // ===== OPTIONAL =====
  @Column({ type: "varchar", length: 20, nullable: true })
  phone?: string;

  // ===== RELATIONS =====
  @OneToMany(() => Rental, (rental) => rental.user)
  rentals: Rental[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  // Trong User entity
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  // ===== TIMESTAMPS =====
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
