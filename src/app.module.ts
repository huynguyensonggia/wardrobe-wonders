import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import EnvConfig from "../bootstrap/env";
import DatabaseConfig from "../bootstrap/database";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TryonModule } from "./modules/tryon/tryon.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AdminModule } from "./modules/admin/admin.module";
import { RentalsModule } from "./modules/rentals/rentals.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { MailModule } from "./modules/mail/mail.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AuditModule } from "./modules/audit/audit.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    EnvConfig(),
    DatabaseConfig(),
    ProductsModule,
    CategoriesModule,
    TryonModule,
    AuthModule,
    UsersModule,
    AdminModule,
    RentalsModule,
    InventoryModule,
    RecommendationsModule,
    MailModule,
    PaymentsModule,
    AuditModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
