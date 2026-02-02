import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, DeepPartial } from "typeorm";

import { Rental } from "./entities/rental.entity";
import { RentalItem } from "./entities/rental-item.entity";
import { CreateRentalDto } from "./dto/create-rental.dto";
import { UpdateRentalDto } from "./dto/update-rental.dto";
import { RentalStatus } from "./enums/rental-status.enum";

import { User } from "../users/entities/user.entity";
import { Product } from "../products/entities/product.entity";

function daysBetweenInclusive(start: Date, end: Date) {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);

  const diff = e.getTime() - s.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

function normalizePhone(input: any) {
  const s = String(input ?? "").trim();
  return s.replace(/[^\d+]/g, "");
}

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalsRepo: Repository<Rental>,

    @InjectRepository(RentalItem)
    private readonly rentalItemsRepo: Repository<RentalItem>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  // =========================
  // CREATE RENTAL (USER)
  // =========================
  async create(userId: number, dto: CreateRentalDto) {
    // 0) validate items
    if (!dto.items?.length) throw new BadRequestException("items is required");

    // 1) validate dates
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

    // 2) validate shipping
    const shipFullName = String((dto as any).shipFullName ?? "").trim();
    const shipPhone = normalizePhone((dto as any).shipPhone);
    const shipAddress = String((dto as any).shipAddress ?? "").trim();
    const shipNote = String((dto as any).shipNote ?? "").trim() || undefined;

    if (!shipFullName) throw new BadRequestException("shipFullName is required");
    if (!shipPhone) throw new BadRequestException("shipPhone is required");
    if (!shipAddress) throw new BadRequestException("shipAddress is required");

    // 3) user exists
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // 4) products exist (✅ unique ids to avoid false missing)
    const productIdsRaw = dto.items.map((i) => i.productId);
    const productIds = Array.from(new Set(productIdsRaw));

    const products = await this.productsRepo.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Products not found: ${missing.join(", ")}`);
    }

    // build map for O(1)
    const productById = new Map<number, Product>();
    for (const p of products) productById.set(p.id, p);

    // 5) totals + prepare snapshots
    let totalPrice = 0;
    let totalDeposit = 0;

    const preparedItems = dto.items.map((it) => {
      const product = productById.get(it.productId)!;

      const rentPricePerDay =
        (product as any).rentPricePerDay ?? (product as any).pricePerDay;

      if (rentPricePerDay == null) {
        throw new BadRequestException(
          `Product ${product.id} missing rentPricePerDay`,
        );
      }

      const deposit = (product as any).deposit ?? 0;

      const quantity = Number(it.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(
          `Invalid quantity for product ${product.id}`,
        );
      }

      const days = totalDays;
      const subtotal = rentPricePerDay * quantity * days;

      totalPrice += subtotal;
      totalDeposit += deposit * quantity;

      return { product, rentPricePerDay, quantity, days, subtotal };
    });

    // ✅ 6) create + save rental (fix overload with DeepPartial)
    const rentalData: DeepPartial<Rental> = {
      user,
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      totalDeposit,
      status: RentalStatus.PENDING,
      note: dto.note?.trim() || undefined,

      shipFullName,
      shipPhone,
      shipAddress,
      shipNote,
    };

    const rentalEntity = this.rentalsRepo.create(rentalData);
    const savedRental = await this.rentalsRepo.save(rentalEntity);

    // ✅ 7) create + save rental items (fix overload with DeepPartial)
    const itemEntities = preparedItems.map((x) =>
      this.rentalItemsRepo.create({
        rental: savedRental, // ✅ object Rental (not array, not {id} needed)
        product: x.product,
        rentPricePerDay: x.rentPricePerDay,
        quantity: x.quantity,
        days: x.days,
        subtotal: x.subtotal,
      } as DeepPartial<RentalItem>),
    );

    await this.rentalItemsRepo.save(itemEntities);

    // ✅ 8) return full
    return this.rentalsRepo.findOne({
      where: { id: savedRental.id },
      relations: ["items", "items.product", "payments"],
    });
  }

  // =========================
  // USER: LIST MY RENTALS
  // =========================
  async findMine(userId: number) {
    return this.rentalsRepo.find({
      where: { user: { id: userId } as any },
      relations: ["items", "items.product", "payments"],
      order: { createdAt: "DESC" as any },
    });
  }

  async findOneMine(userId: number, id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
      relations: ["items", "items.product", "payments"],
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
      relations: ["user", "items", "items.product", "payments"],
      order: { createdAt: "DESC" as any },
      take,
      skip,
    });

    return { data, total, page: Math.max(page, 1), pageSize: take };
  }

  // =========================
  // ADMIN: UPDATE
  // =========================
 async update(id: number, dto: UpdateRentalDto) {
  const rental = await this.rentalsRepo.findOne({ where: { id } });
  if (!rental) throw new NotFoundException("Rental not found");

  const d: any = dto as any;

  // ✅ STATUS: chặn null / rỗng
  if (d.status !== undefined) {
    if (d.status === null || String(d.status).trim() === "") {
      throw new BadRequestException("status cannot be empty");
    }
    rental.status = d.status; // phải là enum lowercase đúng backend
  }

  // ✅ NOTE: cho phép null -> lưu null
  if (d.note !== undefined) {
    rental.note = d.note ?? null;
  }

  // =========================
  // SHIPPING (optional update)
  // =========================

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
    // shipNote cho phép rỗng => null
    const v = String(d.shipNote ?? "").trim();
    rental.shipNote = v || undefined;
  }

  return this.rentalsRepo.save(rental);
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
  // USER: CANCEL
  // =========================
  async cancelMine(userId: number, id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
    });
    if (!rental) throw new NotFoundException("Rental not found");

    // ✅ theo enum mới của bạn: cho cancel khi PENDING / APPROVED (tuỳ bạn)
    const cancellable: RentalStatus[] = [RentalStatus.PENDING, RentalStatus.APPROVED];

    if (!cancellable.includes(rental.status)) {
      throw new BadRequestException("Cannot cancel this rental");
    }

    rental.status = RentalStatus.CANCELLED;
    return this.rentalsRepo.save(rental);
  }
}
