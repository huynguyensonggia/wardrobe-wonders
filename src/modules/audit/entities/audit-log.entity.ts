import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum AuditAction {
  // Users
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",

  // Products
  PRODUCT_CREATE = "PRODUCT_CREATE",
  PRODUCT_UPDATE = "PRODUCT_UPDATE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
  PRODUCT_IMPORT = "PRODUCT_IMPORT",

  // Categories
  CATEGORY_CREATE = "CATEGORY_CREATE",
  CATEGORY_UPDATE = "CATEGORY_UPDATE",
  CATEGORY_DELETE = "CATEGORY_DELETE",

  // Rentals
  RENTAL_STATUS_UPDATE = "RENTAL_STATUS_UPDATE",
  RENTAL_SHIPPING_UPDATE = "RENTAL_SHIPPING_UPDATE",
  RENTAL_SURCHARGE_ADD = "RENTAL_SURCHARGE_ADD",
  RENTAL_REFUND_DEPOSIT = "RENTAL_REFUND_DEPOSIT",
  RENTAL_ACTUAL_RETURN = "RENTAL_ACTUAL_RETURN",
  RENTAL_DELETE = "RENTAL_DELETE",
}

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID của admin thực hiện hành động */
  @Index()
  @Column({ name: "admin_id", type: "int" })
  adminId: number;

  /** Email của admin (snapshot tại thời điểm log, không bị ảnh hưởng nếu email đổi sau) */
  @Column({ name: "admin_email", type: "varchar", length: 255 })
  adminEmail: string;

  /** Loại hành động */
  @Index()
  @Column({ type: "enum", enum: AuditAction })
  action: AuditAction;

  /** Tên resource bị tác động (vd: "rental", "user", "product") */
  @Column({ name: "resource_type", type: "varchar", length: 50 })
  resourceType: string;

  /** ID của resource bị tác động */
  @Index()
  @Column({ name: "resource_id", type: "int", nullable: true })
  resourceId?: number;

  /** Dữ liệu trước khi thay đổi (JSON) */
  @Column({ name: "old_value", type: "json", nullable: true })
  oldValue?: Record<string, any>;

  /** Dữ liệu sau khi thay đổi (JSON) */
  @Column({ name: "new_value", type: "json", nullable: true })
  newValue?: Record<string, any>;

  /** IP của request */
  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
