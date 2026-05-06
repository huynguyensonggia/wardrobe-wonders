import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog, AuditAction } from "./entities/audit-log.entity";

export interface CreateAuditLogDto {
  adminId: number;
  adminEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: number;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Ghi một audit log entry.
   * Không throw — lỗi chỉ được log để không ảnh hưởng luồng chính.
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      const entry = this.auditRepo.create(dto);
      await this.auditRepo.save(entry);
    } catch (err) {
      this.logger.error("Failed to write audit log", err);
    }
  }

  /** Lấy danh sách audit logs (dùng cho admin dashboard sau này) */
  async findAll(page = 1, pageSize = 50) {
    const [items, total] = await this.auditRepo.findAndCount({
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  /** Lấy audit logs theo resource */
  async findByResource(resourceType: string, resourceId: number) {
    return this.auditRepo.find({
      where: { resourceType, resourceId },
      order: { createdAt: "DESC" },
    });
  }
}
