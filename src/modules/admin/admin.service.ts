import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { User } from "../users/entities/user.entity";
import { Rental } from "../rentals/entities/rental.entity";
import { Role } from "../../common/enums/role.enum";
import { RentalStatus } from "../rentals/enums/rental-status.enum";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Rental) private rentalRepo: Repository<Rental>,
  ) {}

  async getStats() {
    const totalProducts = await this.productRepo.count();

    // ✅ total users: chỉ USER (admin không tính)
    const totalUsers = await this.userRepo.count({ where: { role: Role.USER } });

    // ✅ active rentals: SHIPPING + ACTIVE
    const activeRentals = await this.rentalRepo.count({
      where: [{ status: RentalStatus.SHIPPING }, { status: RentalStatus.ACTIVE }],
    });

    // ✅ revenue: sum totalPrice of COMPLETED
    const revenueRow = await this.rentalRepo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.totalPrice), 0)", "sum")
      .where("r.status = :st", { st: RentalStatus.COMPLETED })
      .getRawOne();

    const revenue = Number(revenueRow?.sum ?? 0);

    // =========================
    // ✅ MySQL/MariaDB: weekly rentals (last 7 days)
    // =========================
    // NOTE: nếu cột của bạn là createdAt (camelCase) thì đổi r.created_at -> r.createdAt
    const weeklyRaw = await this.rentalRepo
      .createQueryBuilder("r")
      .select("DATE_FORMAT(r.created_at, '%a')", "label") // Mon/Tue/...
      .addSelect("COUNT(*)", "value")
      .where("r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
      .groupBy("DATE_FORMAT(r.created_at, '%a')")
      .orderBy("MIN(r.created_at)", "ASC")
      .getRawMany();

    const weeklyRentals = weeklyRaw.map((x: any) => ({
      label: String(x.label),
      value: Number(x.value),
    }));

    // =========================
    // ✅ MySQL/MariaDB: monthly revenue (last 6 months)
    // =========================
    const monthlyRaw = await this.rentalRepo
      .createQueryBuilder("r")
      .select("DATE_FORMAT(r.created_at, '%Y-%m')", "label") // 2026-02
      .addSelect("COALESCE(SUM(r.totalPrice), 0)", "value")
      .where("r.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)")
      .andWhere("r.status = :st", { st: RentalStatus.COMPLETED })
      .groupBy("DATE_FORMAT(r.created_at, '%Y-%m')")
      .orderBy("label", "ASC")
      .getRawMany();

    const monthlyRevenue = monthlyRaw.map((x: any) => ({
      label: String(x.label),
      value: Number(x.value),
    }));

    return {
      totalProducts,
      activeRentals,
      revenue,
      totalUsers,
      weeklyRentals,
      monthlyRevenue,
    };
  }
}
