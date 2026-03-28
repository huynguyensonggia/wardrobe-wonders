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
  }) {
    const variant = await this.variantRepo.findOne({ where: { id: dto.variantId } });
    if (!variant) throw new NotFoundException("Variant not found");

    const existing = await this.repo.findOne({ where: { barcode: dto.barcode } });
    if (existing) throw new BadRequestException(`Barcode "${dto.barcode}" already exists`);

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
  // Đổi trạng thái + điều chỉnh stock
  // ========================
  async updateStatus(id: number, status: ConditionStatus, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const variantRepo = manager.getRepository(ProductVariant);

      const item = await itemRepo.findOne({ where: { id } });
      if (!item) throw new NotFoundException("Inventory item not found");

      const prev = item.conditionStatus;

      // Không cho đổi từ retired sang trạng thái khác
      if (prev === ConditionStatus.RETIRED && status !== ConditionStatus.RETIRED) {
        throw new BadRequestException("Không thể thay đổi trạng thái món đã loại bỏ");
      }

      // Không cho đổi nếu giống nhau
      if (prev === status) return item;

      const variant = await variantRepo.findOne({
        where: { id: item.variantId },
        lock: { mode: "pessimistic_write" },
      });
      if (!variant) throw new NotFoundException("Variant not found");

      // === LOGIC STOCK ===
      // Trước đây available → giờ chuyển sang reducing: trừ stock
      const wasAvailable = prev === ConditionStatus.AVAILABLE || prev === ConditionStatus.RETURNED;
      const nowReducing = WAS_REDUCING(status);

      // Trước đây reducing → giờ chuyển về available/returned: cộng stock
      const wasReducing = WAS_REDUCING(prev);
      const nowAvailable = status === ConditionStatus.AVAILABLE || status === ConditionStatus.RETURNED;

      if (wasAvailable && nowReducing) {
        // Chỉ trừ stock khi từ available/returned → reducing
        // Không trừ khi chuyển giữa các reducing statuses (shipping→rented, v.v.)
        if (variant.stock <= 0) throw new BadRequestException("Stock đã về 0, không thể chuyển trạng thái này");
        variant.stock -= 1;
      } else if (wasReducing && nowAvailable) {
        variant.stock += 1;
      }
      // Chuyển giữa reducing statuses (shipping→rented, rented→returned, v.v.) → không đổi stock

      await variantRepo.save(variant);

      // === CẬP NHẬT ITEM ===
      // Khi trả về (rented → returned): tăng totalRentals
      if (prev === ConditionStatus.RENTED && status === ConditionStatus.RETURNED) {
        item.totalRentals += 1;
      }

      if (status === ConditionStatus.RETIRED) {
        item.retiredDate = new Date();
      }

      item.conditionStatus = status;
      if (note !== undefined) item.conditionNote = note;

      return itemRepo.save(item);
    });
  }

  // ========================
  // Sync từ rental status (tự động)
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

    // Tìm inventory item của variant này đang ở trạng thái phù hợp để sync
    // Ưu tiên item đang ở trạng thái trước đó trong luồng
    const prevStatusMap: Record<string, ConditionStatus[]> = {
      shipping:  [ConditionStatus.AVAILABLE],
      active:    [ConditionStatus.SHIPPING, ConditionStatus.AVAILABLE],
      completed: [ConditionStatus.RENTED, ConditionStatus.SHIPPING],
      rejected:  [ConditionStatus.SHIPPING],
    };

    const expectedPrevStatuses = prevStatusMap[rentalStatus] ?? [];

    // Tìm item của variant đang ở trạng thái phù hợp
    let item: InventoryItem | null = null;
    for (const prevStatus of expectedPrevStatuses) {
      item = await this.repo.findOne({
        where: { variantId, conditionStatus: prevStatus },
        order: { totalRentals: "ASC" },
      });
      if (item) break;
    }

    if (!item) {
      console.log(`[syncFromRental] No item found for variantId=${variantId} with statuses=${JSON.stringify(expectedPrevStatuses)}`);
      return;
    }

    if (item.conditionStatus === newStatus) return;

    console.log(`[syncFromRental] Updating item ${item.id} (${item.barcode}) from ${item.conditionStatus} → ${newStatus}`);
    await this.updateStatus(item.id, newStatus);
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
