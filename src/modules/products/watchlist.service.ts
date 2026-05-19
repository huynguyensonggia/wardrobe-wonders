import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductWatchlist } from "./entities/product-watchlist.entity";
import { Product } from "./entities/product.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(ProductWatchlist)
    private readonly repo: Repository<ProductWatchlist>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async watch(userId: number, productId: number): Promise<{ watching: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (!existing) {
      await this.repo.save(this.repo.create({ userId, productId }));
    }
    return { watching: true };
  }

  async unwatch(userId: number, productId: number): Promise<{ watching: boolean }> {
    await this.repo.delete({ userId, productId });
    return { watching: false };
  }

  async isWatching(userId: number, productId: number): Promise<boolean> {
    const count = await this.repo.count({ where: { userId, productId } });
    return count > 0;
  }

  async findByUser(userId: number): Promise<Product[]> {
    const entries = await this.repo.find({
      where: { userId },
      relations: { product: { variants: true, category: true } },
      order: { createdAt: "DESC" },
    });
    return entries.map((e) => e.product);
  }

  // Gọi khi sản phẩm có hàng trở lại — notify tất cả user đang watch
  async notifyWatchers(productId: number, productName: string): Promise<void> {
    const watchers = await this.repo.find({ where: { productId } });
    for (const w of watchers) {
      await this.notificationsService.create(
        w.userId,
        "Sản phẩm bạn quan tâm có hàng! 🎉",
        `"${productName}" đã có hàng trở lại. Đặt thuê ngay trước khi hết!`,
        NotificationType.STOCK_AVAILABLE,
      ).catch(() => {});
    }
  }
}
