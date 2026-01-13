// src/modules/notifications/entities/notification.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { NotificationType } from "../enums/notification-type.enum";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  // Sửa ở đây: thêm name: "is_read" để khớp migration
  @Column({ type: "tinyint", default: 0, name: "is_read" })
  @Index("idx_notifications_is_read") // Giữ index
  isRead: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}