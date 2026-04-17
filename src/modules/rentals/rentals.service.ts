import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  DeepPartial,
  In,
  Repository,
} from "typeorm";

import { Rental } from "./entities/rental.entity";
import { RentalItem } from "./entities/rental-item.entity";
import { RentalSurcharge, SurchargeType } from "./entities/rental-surcharge.entity";
import { ProductVariant } from "../products/entities/product-variant.entity";

import { CreateRentalDto } from "./dto/create-rental.dto";
import { UpdateRentalDto } from "./dto/update-rental.dto";
import { UpdateShippingDto } from "./dto/update-shipping.dto";
import { AddSurchargeDto } from "./dto/add-surcharge.dto";
import { RentalStatus } from "./enums/rental-status.enum";
import { InventoryService } from "../inventory/inventory.service";

import { User } from "../users/entities/user.entity";
import { Product } from "../products/entities/product.entity";
import { Payment } from "../payments/entities/payment.entity";
import { PaymentMethod } from "../payments/enums/payment-method.enum";
import { PaymentStatus } from "../payments/enums/payment-status.enum";
import { MailService } from "../mail/mail.service";

function daysBetweenInclusive(start: Date, end: Date) {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);

  const diff = e.getTime() - s.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

/** Tính tổng tiền thuê: ngày đầu = basePrice, mỗi ngày thêm +10.000 */
function calcRentalPrice(basePrice: number, days: number): number {
  if (days <= 0) return 0;
  return basePrice + (days - 1) * 10_000;
}

function normalizePhone(input: any) {
  const s = String(input ?? "").trim();
  return s.replace(/[^\d+]/g, "");
}

@Injectable()
export class RentalsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Rental)
    private readonly rentalsRepo: Repository<Rental>,

    @InjectRepository(RentalItem)
    private readonly rentalItemsRepo: Repository<RentalItem>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    @InjectRepository(ProductVariant)
    private readonly variantsRepo: Repository<ProductVariant>,

    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,

    @InjectRepository(RentalSurcharge)
    private readonly surchargesRepo: Repository<RentalSurcharge>,

    private readonly inventoryService: InventoryService,
    private readonly mailService: MailService,
  ) { }

  // =========================
  // HELPER: Check overlap ngày thuê theo thời gian
  // =========================
  private async checkDateOverlap(
    variantId: number,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: number,
  ) {
    // Lấy buffer_days của variant
    const variant = await this.variantsRepo.findOne({ where: { id: variantId } });
    const bufferDays = variant?.bufferDays ?? 1;

    // endDate thực tế cần check = endDate + bufferDays
    const bufferedEnd = new Date(endDate);
    bufferedEnd.setDate(bufferedEnd.getDate() + bufferDays);

    // Tìm các rental_items có cùng variantId và overlap ngày
    // Overlap khi: item.rental.start_date <= bufferedEnd AND item.rental.end_date >= startDate
    const qb = this.rentalItemsRepo
      .createQueryBuilder("ri")
      .innerJoin("ri.rental", "r")
      .where("ri.variant_id = :variantId", { variantId })
      .andWhere("r.status IN (:...statuses)", {
        statuses: [RentalStatus.PENDING, RentalStatus.SHIPPING, RentalStatus.ACTIVE],
      })
      .andWhere("r.start_date <= :bufferedEnd", { bufferedEnd })
      .andWhere("r.end_date >= :startDate", { startDate });

    if (excludeRentalId) {
      qb.andWhere("r.id != :excludeRentalId", { excludeRentalId });
    }

    const conflict = await qb.getOne();
    return conflict;
  }

  // =========================
  // CREATE RENTAL (USER)
  // =========================
  async create(userId: number, dto: CreateRentalDto) {
    if (!dto.items?.length) throw new BadRequestException("items is required");

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Invalid startDate/endDate");
    }
    if (end < start) {
      throw new BadRequestException("endDate must be >= startDate");
    }

    const totalDays = daysBetweenInclusive(start, end);
    if (totalDays <= 0) throw new BadRequestException("Invalid rental days");

    // shipping
    const shipFullName = String((dto as any).shipFullName ?? "").trim();
    const shipPhone = normalizePhone((dto as any).shipPhone);
    const shipAddress = String((dto as any).shipAddress ?? "").trim();
    const shipNote = String((dto as any).shipNote ?? "").trim() || undefined;

    if (!shipFullName) throw new BadRequestException("shipFullName is required");
    if (!shipPhone) throw new BadRequestException("shipPhone is required");
    if (!shipAddress) throw new BadRequestException("shipAddress is required");

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // ✅ unique variant ids
    const variantIdsRaw = dto.items.map((i: any) => Number(i.variantId));
    if (variantIdsRaw.some((x) => !Number.isFinite(x) || x <= 0)) {
      throw new BadRequestException("items[].variantId is required and must be positive");
    }
    const variantIds = Array.from(new Set(variantIdsRaw));

    const variants = await this.variantsRepo.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });

    if (variants.length !== variantIds.length) {
      const found = new Set(variants.map((v) => v.id));
      const missing = variantIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Variants not found: ${missing.join(", ")}`);
    }

    const variantById = new Map<number, ProductVariant>();
    for (const v of variants) variantById.set(v.id, v);

    let totalPrice = 0;
    let totalDeposit = 0;

    const preparedItems = await Promise.all(dto.items.map(async (it: any) => {
      const variant = variantById.get(Number(it.variantId))!;
      const product = variant.product;

      // ✅ đảm bảo variant thuộc product mà client gửi
      if (product.id !== Number(it.productId)) {
        throw new BadRequestException(
          `Variant ${variant.id} does not belong to product ${it.productId}`,
        );
      }

      const rentPricePerDay =
        (product as any).rentPricePerDay ?? (product as any).pricePerDay;

      if (rentPricePerDay == null) {
        throw new BadRequestException(`Product ${product.id} missing rentPricePerDay`);
      }

      const deposit = (product as any).deposit ?? 0;

      const quantity = Number(it.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Invalid quantity for product ${product.id}`);
      }

      // ✅ check stock trước (chưa trừ ở đây)
      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Out of stock for product ${product.id} size ${variant.size}`,
        );
      }

      // ✅ check overlap ngày thuê
      const conflict = await this.checkDateOverlap(variant.id, start, end);
      if (conflict) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" size ${variant.size} đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác.`,
        );
      }

      const days = totalDays;
      const subtotal = calcRentalPrice(rentPricePerDay, days) * quantity;
      const depositAmt = (product as any).deposit ?? 0;

      return { product, variant, rentPricePerDay, quantity, days, subtotal, deposit: depositAmt };
    }));

    // Tính tổng sau khi có tất cả items
    for (const item of preparedItems) {
      totalPrice += item.subtotal;
      totalDeposit += item.deposit * item.quantity;
    }

    const rentalData: DeepPartial<Rental> = {
      user,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      totalDeposit,
      status: RentalStatus.PENDING,
      note: dto.note?.trim() || undefined,
      pickupType: dto.pickupType ?? ("delivery" as any),
      shipFullName,
      shipPhone,
      shipAddress,
      shipNote,
    };

    const savedRental = await this.rentalsRepo.save(this.rentalsRepo.create(rentalData));

    const itemEntities = preparedItems.map((x) =>
      this.rentalItemsRepo.create({
        rental: savedRental,
        product: x.product,

        variant: x.variant,
        variantId: x.variant.id,

        rentPricePerDay: x.rentPricePerDay,
        quantity: x.quantity,
        days: x.days,
        subtotal: x.subtotal,
      } as DeepPartial<RentalItem>),
    );

    await this.rentalItemsRepo.save(itemEntities);

    // =========================
    // TẠO PAYMENT RECORD (tiền cọc + tiền thuê, phương thức CASH mặc định)
    // =========================
    const method = dto.paymentMethod ?? PaymentMethod.CASH;

    // Payment 1: tiền thuê
    if (totalPrice > 0) {
      await this.paymentsRepo.save(
        this.paymentsRepo.create({
          rental: savedRental,
          user,
          amount: totalPrice,
          method,
          status: PaymentStatus.PENDING,
          transactionCode: `RENT-${savedRental.id}-${Date.now()}`,
        } as DeepPartial<Payment>),
      );
    }

    // Payment 2: tiền cọc (nếu có)
    if (totalDeposit > 0) {
      await this.paymentsRepo.save(
        this.paymentsRepo.create({
          rental: savedRental,
          user,
          amount: totalDeposit,
          method,
          status: PaymentStatus.PENDING,
          transactionCode: `DEP-${savedRental.id}-${Date.now()}`,
        } as DeepPartial<Payment>),
      );
    }

    const finalRental = await this.rentalsRepo.findOne({
      where: { id: savedRental.id },
      relations: ["items", "items.product", "items.variant", "payments", "user"],
    });

    // Gửi email xác nhận đơn thuê (không block response)
    if (finalRental && user.email) {
      const emailItems = finalRental.items.map((it) => ({
        name: it.product?.name ?? `Sản phẩm #${it.id}`,
        size: it.variant?.size ?? "",
        quantity: it.quantity,
        subtotal: it.subtotal,
      }));

      this.mailService.sendRentalConfirmation({
        to: user.email,
        customerName: user.name,
        rentalId: finalRental.id,
        startDate: new Date(finalRental.startDate).toLocaleDateString("vi-VN"),
        endDate: new Date(finalRental.endDate).toLocaleDateString("vi-VN"),
        totalDays: finalRental.totalDays,
        items: emailItems,
        totalPrice: finalRental.totalPrice,
        totalDeposit: finalRental.totalDeposit,
        shipAddress: finalRental.shipAddress,
        paymentMethod: String(dto.paymentMethod ?? "CASH"),
      }).catch(() => {});
    }

    return finalRental;
  }

  // =========================
  // USER: LIST MY RENTALS
  // =========================
  async findMine(userId: number) {
    return this.rentalsRepo.find({
      where: { user: { id: userId } as any },
      relations: ["items", "items.product", "items.variant", "payments"],
      order: { createdAt: "DESC" as any },
    });
  }

  async findOneMine(userId: number, id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
      relations: ["items", "items.product", "items.variant", "payments"],
    });
    if (!rental) throw new NotFoundException("Rental not found");
    return rental;
  }

  // =========================
  // ADMIN: LIST ALL
  // =========================
  async findAll(page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await this.rentalsRepo.findAndCount({
      relations: ["user", "items", "items.product", "items.variant", "payments"],
      order: { createdAt: "DESC" as any },
      take,
      skip,
    });

    return { data, total, page: Math.max(page, 1), pageSize: take };
  }

  // =========================
  // ADMIN: UPDATE (status/note + shipping optional) + STOCK LOGIC
  // Trừ stock khi chuyển -> ACTIVE
  // Cộng lại stock khi ACTIVE -> COMPLETED / CANCELLED / REJECTED
  // =========================
  async update(id: number, dto: UpdateRentalDto) {
    let nextStatus: RentalStatus | undefined;
    let prevStatus: RentalStatus | undefined;

    const result = await this.dataSource.transaction(async (manager) => {
      const rentalsRepo = manager.getRepository(Rental);
      const itemsRepo = manager.getRepository(RentalItem);
      const variantsRepo = manager.getRepository(ProductVariant);

      const rental = await rentalsRepo.findOne({ where: { id } });
      if (!rental) throw new NotFoundException("Rental not found");

      prevStatus = rental.status;
      nextStatus = dto.status ?? rental.status;

      const d: any = dto as any;

      // NOTE
      if (d.note !== undefined) rental.note = d.note ?? null;

      // SHIPPING FIELDS
      if (d.shipFullName !== undefined) {
        if (d.shipFullName === null) throw new BadRequestException("shipFullName cannot be null");
        const v = String(d.shipFullName).trim();
        if (!v) throw new BadRequestException("shipFullName cannot be empty");
        rental.shipFullName = v;
      }

      if (d.shipPhone !== undefined) {
        if (d.shipPhone === null) throw new BadRequestException("shipPhone cannot be null");
        const v = normalizePhone(d.shipPhone);
        if (!v) throw new BadRequestException("shipPhone cannot be empty");
        rental.shipPhone = v;
      }

      if (d.shipAddress !== undefined) {
        if (d.shipAddress === null) throw new BadRequestException("shipAddress cannot be null");
        const v = String(d.shipAddress).trim();
        if (!v) throw new BadRequestException("shipAddress cannot be empty");
        rental.shipAddress = v;
      }

      if (d.shipNote !== undefined) {
        const v = String(d.shipNote ?? "").trim();
        rental.shipNote = v || undefined;
      }

      // STATUS + STOCK
      if (dto.status !== undefined) {
        if (dto.status === null || String(dto.status).trim() === "") {
          throw new BadRequestException("status cannot be empty");
        }

        if (nextStatus !== prevStatus) {
          const items = await itemsRepo.find({
            where: { rental: { id } as any },
          });

          // ✅ Trừ stock khi chuyển sang ACTIVE
          const shouldDeduct =
            nextStatus === RentalStatus.ACTIVE && prevStatus !== RentalStatus.ACTIVE;

          // ✅ Cộng lại khi từ ACTIVE -> COMPLETED/CANCELLED/REJECTED
          const shouldReturn =
            prevStatus === RentalStatus.ACTIVE &&
            (nextStatus === RentalStatus.COMPLETED ||
              nextStatus === RentalStatus.CANCELLED ||
              nextStatus === RentalStatus.REJECTED);

          if (shouldDeduct) {
            for (const it of items) {
              const v = await variantsRepo.findOne({
                where: { id: it.variantId },
                lock: { mode: "pessimistic_write" },
              });
              if (!v) throw new BadRequestException(`Variant not found: ${it.variantId}`);

              if (v.stock < it.quantity) {
                throw new BadRequestException(`Out of stock for variant ${v.id}`);
              }

              v.stock -= it.quantity;
              await variantsRepo.save(v);
            }
          }

          if (shouldReturn) {
            for (const it of items) {
              const v = await variantsRepo.findOne({
                where: { id: it.variantId },
                lock: { mode: "pessimistic_write" },
              });
              if (!v) throw new BadRequestException(`Variant not found: ${it.variantId}`);

              v.stock += it.quantity;
              await variantsRepo.save(v);
            }
          }

          rental.status = nextStatus;
        }
      }

      const saved = await rentalsRepo.save(rental);

      return rentalsRepo.findOne({
        where: { id: saved.id },
        relations: ["user", "items", "items.product", "items.variant", "payments"],
      });
    });

    // Sync inventory NGOÀI transaction để tránh deadlock
    if (nextStatus && nextStatus !== prevStatus) {
      const allItems = await this.rentalItemsRepo.find({ where: { rental: { id } as any } });
      await Promise.all(
        allItems.map((ri) =>
          this.inventoryService.syncFromRental(ri.id, ri.variantId, nextStatus!).catch(() => {})
        )
      );
    }

    return result;
  }

  // =========================
  // ADMIN: UPDATE SHIPPING (route riêng)
  // =========================
  async updateShipping(id: number, dto: UpdateShippingDto) {
    const rental = await this.rentalsRepo.findOne({ where: { id } });
    if (!rental) throw new NotFoundException("Rental not found");

    const editable: RentalStatus[] = [
      RentalStatus.PENDING,
      RentalStatus.SHIPPING,
    ].filter(Boolean) as RentalStatus[];

    if (!editable.includes(rental.status)) {
      throw new BadRequestException("Only can edit shipping when PENDING/SHIPPING");
    }

    if (dto.shipFullName !== undefined) {
      const v = String(dto.shipFullName ?? "").trim();
      if (!v) throw new BadRequestException("shipFullName cannot be empty");
      rental.shipFullName = v;
    }

    if (dto.shipPhone !== undefined) {
      const v = normalizePhone(dto.shipPhone);
      if (!v) throw new BadRequestException("shipPhone cannot be empty");
      rental.shipPhone = v;
    }

    if (dto.shipAddress !== undefined) {
      const v = String(dto.shipAddress ?? "").trim();
      if (!v) throw new BadRequestException("shipAddress cannot be empty");
      rental.shipAddress = v;
    }

    if (dto.shipNote !== undefined) {
      const v = String(dto.shipNote ?? "").trim();
      rental.shipNote = v || undefined;
    }

    const saved = await this.rentalsRepo.save(rental);

    return this.rentalsRepo.findOne({
      where: { id: saved.id },
      relations: ["user", "items", "items.product", "items.variant", "payments"],
    });
  }

  // =========================
  // ADMIN: ADD SURCHARGE (phí phát sinh)
  // =========================
  async addSurcharge(rentalId: number, dto: AddSurchargeDto) {
    const rental = await this.rentalsRepo.findOne({ where: { id: rentalId } });
    if (!rental) throw new NotFoundException("Rental not found");

    const surcharge = this.surchargesRepo.create({
      rental,
      type: dto.type,
      amount: dto.amount,
      note: dto.note,
    });

    await this.surchargesRepo.save(surcharge);

    // Cộng thêm vào totalPrice
    rental.totalPrice += dto.amount;
    await this.rentalsRepo.save(rental);

    return this.rentalsRepo.findOne({
      where: { id: rentalId },
      relations: ["user", "items", "items.product", "items.variant", "payments", "surcharges"],
    });
  }

  // =========================
  // ADMIN: SET ACTUAL RETURN DATE
  // =========================
  async setActualReturnDate(rentalId: number, actualReturnDate: string) {
    const rental = await this.rentalsRepo.findOne({ where: { id: rentalId } });
    if (!rental) throw new NotFoundException("Rental not found");

    const date = new Date(actualReturnDate);
    if (isNaN(date.getTime())) throw new BadRequestException("Invalid date");

    rental.actualReturnDate = date;
    return this.rentalsRepo.save(rental);
  }

  // =========================
  // ADMIN: CHECK AVAILABILITY (kiểm tra ngày thuê có trống không)
  // =========================
  async checkAvailability(variantId: number, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const conflict = await this.checkDateOverlap(variantId, start, end);
    return { available: !conflict };
  }

  // =========================
  // ADMIN: REMOVE
  // =========================
  async remove(id: number) {
    const rental = await this.rentalsRepo.findOne({ where: { id } });
    if (!rental) throw new NotFoundException("Rental not found");
    await this.rentalsRepo.delete(id);
    return { deleted: true };
  }

  // =========================
  // ADMIN: REFUND DEPOSIT
  // Đánh dấu payment tiền cọc là REFUNDED
  // =========================
  async refundDeposit(id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id },
      relations: ["payments"],
    });
    if (!rental) throw new NotFoundException("Rental not found");

    if (rental.status !== RentalStatus.COMPLETED) {
      throw new BadRequestException("Can only refund deposit for COMPLETED rentals");
    }

    // Tìm payment tiền cọc (transactionCode bắt đầu bằng DEP-)
    const depositPayments = rental.payments.filter(
      (p) => p.transactionCode?.startsWith("DEP-") && p.status !== PaymentStatus.REFUNDED,
    );

    if (!depositPayments.length) {
      throw new BadRequestException("No deposit payment found or already refunded");
    }

    for (const p of depositPayments) {
      p.status = PaymentStatus.REFUNDED;
      p.paidAt = new Date();
      await this.paymentsRepo.save(p);
    }

    return { refunded: true, count: depositPayments.length };
  }

  // =========================
  // USER: CANCEL
  // (không hoàn kho ở đây vì user chỉ cancel khi pending)
  // =========================
  async cancelMine(userId: number, id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
    });
    if (!rental) throw new NotFoundException("Rental not found");

    const cancellable: RentalStatus[] = [RentalStatus.PENDING];

    if (!cancellable.includes(rental.status)) {
      throw new BadRequestException("Cannot cancel this rental");
    }

    rental.status = RentalStatus.CANCELLED;
    return this.rentalsRepo.save(rental);
  }

  // =========================
  // USER: EXTEND
  // Chỉ cho phép gia hạn khi ACTIVE
  // =========================
  async extendMine(userId: number, id: number, newEndDate: string) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
      relations: ["items", "items.product"],
    });
    if (!rental) throw new NotFoundException("Rental not found");

    if (rental.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException("Can only extend ACTIVE rentals");
    }

    const end = new Date(newEndDate);
    if (isNaN(end.getTime())) throw new BadRequestException("Invalid endDate");

    const currentEnd = new Date(rental.endDate);
    if (end <= currentEnd) {
      throw new BadRequestException("New end date must be after current end date");
    }

    const extraDays = daysBetweenInclusive(
      new Date(currentEnd.getTime() + 86400000),
      end,
    );

    const extraPrice = rental.items.reduce((sum, it) => {
      return sum + calcRentalPrice(it.rentPricePerDay ?? 0, extraDays) * it.quantity;
    }, 0);

    rental.endDate = end;
    rental.totalDays = daysBetweenInclusive(new Date(rental.startDate), end);
    rental.totalPrice = rental.totalPrice + extraPrice;

    const saved = await this.rentalsRepo.save(rental);

    // Tạo payment record cho phần gia hạn
    if (extraPrice > 0) {
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      await this.paymentsRepo.save(
        this.paymentsRepo.create({
          rental: saved,
          user: user!,
          amount: extraPrice,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
          transactionCode: `EXT-${id}-${Date.now()}`,
        } as DeepPartial<Payment>),
      );
    }

    return this.rentalsRepo.findOne({
      where: { id: saved.id },
      relations: ["items", "items.product", "items.variant", "payments"],
    });
  }
}
