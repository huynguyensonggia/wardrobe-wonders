import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.register({
      secret: (() => {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET env var is required");
        return process.env.JWT_SECRET;
      })(),
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
