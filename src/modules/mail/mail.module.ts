import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailService } from "./mail.service";
import { RentalReminderScheduler } from "./rental-reminder.scheduler";
import { Rental } from "../rentals/entities/rental.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [TypeOrmModule.forFeature([Rental]), NotificationsModule],
  providers: [MailService, RentalReminderScheduler],
  exports: [MailService],
})
export class MailModule {}
