import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailService } from "./mail.service";
import { RentalReminderScheduler } from "./rental-reminder.scheduler";
import { Rental } from "../rentals/entities/rental.entity";

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
        port: Number(process.env.MAIL_PORT) || 587,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: `"AI Closet" <no-reply@aicloset.vn>`,
      },
    }),
    TypeOrmModule.forFeature([Rental]),
  ],
  providers: [MailService, RentalReminderScheduler],
  exports: [MailService],
})
export class MailModule {}
