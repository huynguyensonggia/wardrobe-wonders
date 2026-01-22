import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";

import { Rental } from "./entities/rental.entity";
import { RentalItem } from "./entities/rental-item.entity";
import { CreateRentalDto } from "./dto/create-rental.dto";
import { UpdateRentalDto } from "./dto/update-rental.dto";
import { RentalStatus } from "./enums/rental-status.enum";

import { User } from "../users/entities/user.entity";
import { Product } from "../products/entities/product.entity";

function daysBetweenInclusive(start: Date, end: Date) {
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);
  const diff = e.getTime() - s.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental) private readonly rentalsRepo: Repository<Rental>,
    @InjectRepository(RentalItem) private readonly rentalItemsRepo: Repository<RentalItem>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
  ) { }

  async create(userId: number, dto: CreateRentalDto) {
    if (!dto.items?.length) throw new BadRequestException("items is required");

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Invalid startDate/endDate");
    }
    if (end < start) throw new BadRequestException("endDate must be >= startDate");

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productsRepo.find({ where: { id: In(productIds) } });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Products not found: ${missing.join(", ")}`);
    }

    const totalDays = daysBetweenInclusive(start, end);
    if (totalDays <= 0) throw new BadRequestException("Invalid rental days");

    // Tính totals + prepare item snapshots
    let totalPrice = 0;
    let totalDeposit = 0;

    const preparedItems = dto.items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!;

      const rentPricePerDay = (p as any).rentPricePerDay ?? (p as any).pricePerDay;
      if (rentPricePerDay == null) {
        throw new BadRequestException(`Product ${p.id} missing rentPricePerDay`);
      }

      const deposit = (p as any).deposit ?? 0;

      const quantity = it.quantity;
      const days = totalDays;
      const subtotal = rentPricePerDay * quantity * days;

      totalPrice += subtotal;
      totalDeposit += deposit * quantity;

      return { p, rentPricePerDay, quantity, days, subtotal };
    });

    // ✅ BƯỚC 1: save RENTAL trước (KHÔNG save items ở đây)
    const rental = await this.rentalsRepo.save(
      this.rentalsRepo.create({
        user,
        startDate: start,
        endDate: end,
        totalDays,
        totalPrice,
        totalDeposit,
        status: RentalStatus.PENDING,
        note: dto.note,
      })
    );

    // ✅ BƯỚC 2: save ITEMS với rental_id đã có
    const items = preparedItems.map((x) =>
      this.rentalItemsRepo.create({
        rental: { id: rental.id } as any, // ✅ ép set FK rental_id
        product: x.p,
        rentPricePerDay: x.rentPricePerDay,
        quantity: x.quantity,
        days: x.days,
        subtotal: x.subtotal,
      })
    );

    console.log("RENTAL_ID =", rental.id);

    await this.rentalItemsRepo.save(items);

    // ✅ (tuỳ) trả về đầy đủ quan hệ
    return this.rentalsRepo.findOne({
      where: { id: rental.id },
      relations: ["items", "items.product", "payments"],
    });
  }

  // USER: list rentals của mình
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

  // ADMIN: list all
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

  async update(id: number, dto: UpdateRentalDto) {
    const rental = await this.rentalsRepo.findOne({ where: { id } });
    if (!rental) throw new NotFoundException("Rental not found");

    Object.assign(rental, dto);
    return this.rentalsRepo.save(rental);
  }

  async remove(id: number) {
    const rental = await this.rentalsRepo.findOne({ where: { id } });
    if (!rental) throw new NotFoundException("Rental not found");
    await this.rentalsRepo.delete(id);
    return { deleted: true };
  }

  // USER: cancel (tuỳ rule)
  async cancelMine(userId: number, id: number) {
    const rental = await this.rentalsRepo.findOne({
      where: { id, user: { id: userId } as any },
    });
    if (!rental) throw new NotFoundException("Rental not found");

    // Rule đơn giản: chỉ cancel khi pending/approved
    if (![RentalStatus.PENDING, RentalStatus.APPROVED].includes(rental.status)) {
      throw new BadRequestException("Cannot cancel this rental");
    }

    rental.status = RentalStatus.CANCELLED;
    return this.rentalsRepo.save(rental);
  }
}
