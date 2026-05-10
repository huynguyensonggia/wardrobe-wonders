import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Rental } from "../rentals/entities/rental.entity";
import { RentalStatus } from "../rentals/enums/rental-status.enum";
import { MailService } from "./mail.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";

@Injectable()
export class RentalReminderScheduler {
  private readonly logger = new Logger(RentalReminderScheduler.name);

  constructor(
    @InjectRepository(Rental)
    private readonly rentalsRepo: Repository<Rental>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Chạy mỗi ngày lúc 8:00 sáng — nhắc trả đồ trước 22:30 tối cho đơn hết hạn HÔM NAY
  @Cron("0 8 * * *", { timeZone: "Asia/Ho_Chi_Minh" })
  async sendReturnReminders() {
    this.logger.log("Running return reminder job...");

    // Tìm đơn ACTIVE có endDate = HÔM NAY → nhắc trả trước 23:59 hôm nay
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const rentals = await this.rentalsRepo.find({
      where: {
        status: RentalStatus.ACTIVE,
        endDate: Between(start, end) as any,
      },
      relations: ["user", "items", "items.product", "items.variant"],
    });

    this.logger.log(`Found ${rentals.length} rental(s) expiring tomorrow`);

    for (const rental of rentals) {
      if (!rental.user?.email) continue;

      const items = rental.items.map((it) => ({
        name: it.product?.name ?? `Sản phẩm #${it.id}`,
        size: it.variant?.size ?? "",
        quantity: it.quantity,
      }));

      await this.mailService.sendReturnReminder({
        to: rental.user.email,
        customerName: rental.user.name,
        rentalId: rental.id,
        returnDate: new Date(rental.endDate).toLocaleDateString("vi-VN"),
        items,
      });

      // Tạo in-app notification nhắc trả hàng
      if (rental.user?.id) {
        await this.notificationsService.create(
          rental.user.id,
          "⏰ Nhắc trả hàng hôm nay",
          `Đơn #${rental.id} cần được trả trước 22:30 tối nay (${new Date(rental.endDate).toLocaleDateString("vi-VN")}). Vui lòng liên hệ để sắp xếp shipper.`,
          NotificationType.RETURN_REMINDER,
        ).catch(() => {});
      }

      this.logger.log(`Sent reminder to ${rental.user.email} for rental #${rental.id}`);
    }
  }
}
