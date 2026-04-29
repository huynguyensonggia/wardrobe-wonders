import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { InventoryItem, ConditionStatus } from "./entities/inventory-item.entity";
import { ProductVariant } from "../products/entities/product-variant.entity";

// Các status làm giảm stock (món không available)
const STOCK_REDUCING_STATUSES = [
  ConditionStatus.WASHING,
  ConditionStatus.REPAIRING,
  ConditionStatus.RETIRED,
  ConditionStatus.RENTED,
  ConditionStatus.SHIPPING,
];

// Các status trước đó làm giảm stock (cần cộng lại khi chuyển sang available)
const WAS_REDUCING = (s: ConditionStatus) => STOCK_REDUCING_STATUSES.includes(s);

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,

    private readonly dataSource: DataSource,
  ) {}

  // ========================
  // Tạo món đồ mới vào kho → cộng stock +1
  // ========================
  async create(dto: {
    variantId: number;
    barcode: string;
    maxRentals?: number;
    conditionNote?: string;
    acquiredDate?: string;
    skipStockUpdate?: boolean; // dùng khi tạo từ product (stock đã set đúng)
  }) {
    const variant = await this.variantRepo.findOne({ where: { id: dto.variantId } });
    if (!variant) throw new NotFoundException("Variant not found");

    const existing = await this.repo.findOne({ where: { barcode: dto.barcode } });
    if (existing) throw new BadRequestException(`Barcode "${dto.barcode}" already exists`);

    if (dto.skipStockUpdate) {
      // Tạo item mà không cộng stock (stock đã được set đúng khi tạo variant)
      const item = this.repo.create({
        variantId: dto.variantId,
        variant,
        barcode: dto.barcode,
        maxRentals: dto.maxRentals ?? 50,
        conditionNote: dto.conditionNote,
        acquiredDate: dto.acquiredDate ? new Date(dto.acquiredDate) : undefined,
        conditionStatus: ConditionStatus.AVAILABLE,
      });
      return this.repo.save(item);
    }

    return this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const itemRepo = manager.getRepository(InventoryItem);

      const item = itemRepo.create({
        variantId: dto.variantId,
        variant,
        barcode: dto.barcode,
        maxRentals: dto.maxRentals ?? 50,
        conditionNote: dto.conditionNote,
        acquiredDate: dto.acquiredDate ? new Date(dto.acquiredDate) : undefined,
        conditionStatus: ConditionStatus.AVAILABLE,
      });

      const saved = await itemRepo.save(item);

      // Thêm món mới → cộng stock +1
      const v = await variantRepo.findOne({ where: { id: dto.variantId }, lock: { mode: "pessimistic_write" } });
      if (v) { v.stock += 1; await variantRepo.save(v); }

      return saved;
    });
  }

  // ========================
  // Đổi trạng thái thủ công (admin) — chỉ cho phép sau khi returned
  // shipping/rented được quản lý tự động bởi rental sync
  // ========================
  async updateStatus(id: number, status: ConditionStatus, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const variantRepo = manager.getRepository(ProductVariant);

      const item = await itemRepo.findOne({ where: { id } });
      if (!item) throw new NotFoundException("Inventory item not found");

      const prev = item.conditionStatus;

      if (prev === ConditionStatus.RETIRED && status !== ConditionStatus.RETIRED) {
        throw new BadRequestException("Không thể thay đổi trạng thái món đã loại bỏ");
      }

      // ✅ Chỉ cho admin đổi thủ công khi item đang RETURNED hoặc AVAILABLE
      // shipping/rented được quản lý tự động bởi rental
      const adminAllowedFrom = [ConditionStatus.RETURNED, ConditionStatus.AVAILABLE, ConditionStatus.WASHING, ConditionStatus.REPAIRING];
      if (!adminAllowedFrom.includes(prev)) {
        throw new BadRequestException(
          `Không thể đổi thủ công khi đang ở trạng thái "${prev}". Trạng thái này được quản lý tự động theo đơn thuê.`
        );
      }

      // ✅ Khi returned: chỉ được đổi sang washing hoặc repairing (bắt buộc qua quy trình)
      if (prev === ConditionStatus.RETURNED) {
        const allowedFromReturned = [ConditionStatus.WASHING, ConditionStatus.REPAIRING, ConditionStatus.RETIRED];
        if (!allowedFromReturned.includes(status)) {
          throw new BadRequestException(
            `Sau khi trả hàng, phải chuyển sang "Đang giặt" hoặc "Đang sửa" trước khi về "Sẵn sàng".`
          );
        }
      }

      if (prev === status) {
        if (note !== undefined) { item.conditionNote = note; return itemRepo.save(item); }
        return item;
      }

      const variant = await variantRepo.findOne({
        where: { id: item.variantId },
        lock: { mode: "pessimistic_write" },
      });
      if (!variant) throw new NotFoundException("Variant not found");

      // === STOCK LOGIC (chỉ khi admin đổi thủ công) ===
      // returned/available → washing/repairing/retired: trừ stock
      // Nhưng "returned" thực ra stock đã = 0 (rental đã trừ khi PENDING, chưa hoàn)
      // → chỉ trừ stock khi từ AVAILABLE (hàng đang sẵn sàng cho thuê)
      const wasAvailable = prev === ConditionStatus.AVAILABLE;
      const nowReducing = [ConditionStatus.WASHING, ConditionStatus.REPAIRING, ConditionStatus.RETIRED].includes(status);

      // washing/repairing → available: cộng stock (hàng xong giặt/sửa, sẵn sàng lại)
      const wasReducing = [ConditionStatus.WASHING, ConditionStatus.REPAIRING].includes(prev);
      const nowAvailable = status === ConditionStatus.AVAILABLE;

      if (wasAvailable && nowReducing) {
        if (variant.stock <= 0) throw new BadRequestException("Stock đã về 0");
        variant.stock -= 1;
      } else if (wasReducing && nowAvailable) {
        variant.stock += 1;
      }
      // returned → washing/repairing: stock không đổi (đã = 0, chờ giặt/sửa xong mới +1)

      await variantRepo.save(variant);

      if (status === ConditionStatus.RETIRED) item.retiredDate = new Date();
      item.conditionStatus = status;
      if (note !== undefined) item.conditionNote = note;

      return itemRepo.save(item);
    });
  }

  // ========================
  // Sync từ rental status (tự động) — CHỈ đổi conditionStatus, KHÔNG đụng stock
  // Stock đã được quản lý bởi rentals.service (trừ khi PENDING, hoàn khi CANCELLED/REJECTED)
  // ========================
  async syncFromRental(rentalItemId: number, variantId: number, rentalStatus: string) {
    const statusMap: Record<string, ConditionStatus> = {
      shipping:  ConditionStatus.SHIPPING,
      active:    ConditionStatus.RENTED,
      completed: ConditionStatus.RETURNED,
      cancelled: ConditionStatus.AVAILABLE,
      rejected:  ConditionStatus.AVAILABLE,
    };

    const newStatus = statusMap[rentalStatus];
    if (!newStatus) return;

    // Tìm item phù hợp theo thứ tự ưu tiên
    const prevStatusMap: Record<string, ConditionStatus[]> = {
      shipping:  [ConditionStatus.AVAILABLE],
      active:    [ConditionStatus.SHIPPING, ConditionStatus.AVAILABLE],
      completed: [ConditionStatus.RENTED, ConditionStatus.SHIPPING, ConditionStatus.AVAILABLE],
      cancelled: [ConditionStatus.AVAILABLE, ConditionStatus.SHIPPING, ConditionStatus.RENTED],
      rejected:  [ConditionStatus.AVAILABLE, ConditionStatus.SHIPPING, ConditionStatus.RENTED],
    };

    const expectedPrevStatuses = prevStatusMap[rentalStatus] ?? [];

    let item: InventoryItem | null = null;
    for (const prevStatus of expectedPrevStatuses) {
      item = await this.repo.findOne({
        where: { variantId, conditionStatus: prevStatus },
        order: { totalRentals: "ASC" },
      });
      if (item) break;
    }

    if (!item) {
      console.log(`[syncFromRental] No item found for variantId=${variantId}, statuses=${JSON.stringify(expectedPrevStatuses)}`);
      return;
    }

    if (item.conditionStatus === newStatus) return;

    console.log(`[syncFromRental] ${item.barcode}: ${item.conditionStatus} → ${newStatus}`);

    // ✅ Cập nhật conditionStatus trực tiếp — KHÔNG đụng stock
    // Stock được quản lý hoàn toàn bởi rentals.service:
    //   - Trừ khi tạo đơn PENDING
    //   - Hoàn khi COMPLETED / CANCELLED / REJECTED
    // Khi trả về (rented → returned): tăng totalRentals
    const wasRented = item.conditionStatus === ConditionStatus.RENTED;

    item.conditionStatus = newStatus;

    if (wasRented && newStatus === ConditionStatus.RETURNED) {
      item.totalRentals += 1;
    }

    await this.repo.save(item);
  }

  // ========================
  // Lấy danh sách theo variant
  // ========================
  async findByVariant(variantId: number) {
    return this.repo.find({
      where: { variantId },
      relations: ["variant", "variant.product"],
      order: { conditionStatus: "ASC", id: "ASC" },
    });
  }

  async findByProduct(productId: number) {
    return this.repo
      .createQueryBuilder("i")
      .leftJoinAndSelect("i.variant", "v")
      .leftJoinAndSelect("v.product", "p")
      .where("v.product_id = :productId", { productId })
      .orderBy("v.size", "ASC")
      .addOrderBy("i.id", "ASC")
      .getMany();
  }

  // ========================
  // Lấy tất cả (admin)
  // ========================
  async findAll(filters?: { status?: ConditionStatus; variantId?: number }) {
    const qb = this.repo.createQueryBuilder("i")
      .leftJoinAndSelect("i.variant", "v")
      .leftJoinAndSelect("v.product", "p")
      .orderBy("i.conditionStatus", "ASC")
      .addOrderBy("i.id", "ASC");

    if (filters?.status) qb.andWhere("i.condition_status = :status", { status: filters.status });
    if (filters?.variantId) qb.andWhere("i.variant_id = :variantId", { variantId: filters.variantId });

    return qb.getMany();
  }

  // ========================
  // Lấy món đồ available cho variant (ưu tiên ít dùng nhất)
  // ========================
  async getAvailableItem(variantId: number): Promise<InventoryItem | null> {
    return this.repo.findOne({
      where: { variantId, conditionStatus: ConditionStatus.AVAILABLE },
      order: { totalRentals: "ASC" },
    });
  }

  // ========================
  // Đề xuất thanh lý
  // ========================
  async getRetirementCandidates(threshold = 40) {
    return this.repo
      .createQueryBuilder("i")
      .leftJoinAndSelect("i.variant", "v")
      .leftJoinAndSelect("v.product", "p")
      .where("i.total_rentals >= :threshold", { threshold })
      .andWhere("i.condition_status != :retired", { retired: ConditionStatus.RETIRED })
      .orderBy("i.total_rentals", "DESC")
      .getMany();
  }

  // ========================
  // Kiểm kê: đếm theo trạng thái
  // ========================
  async getStockSummary(variantId?: number) {
    const qb = this.repo
      .createQueryBuilder("i")
      .select("i.condition_status", "status")
      .addSelect("COUNT(*)", "count");

    if (variantId) qb.where("i.variant_id = :variantId", { variantId });

    return qb.groupBy("i.condition_status").getRawMany();
  }

  // ========================
  // Tìm theo barcode
  // ========================
  async findByBarcode(barcode: string) {
    const item = await this.repo.findOne({
      where: { barcode },
      relations: ["variant", "variant.product"],
    });
    if (!item) throw new NotFoundException(`Barcode "${barcode}" not found`);
    return item;
  }
}
