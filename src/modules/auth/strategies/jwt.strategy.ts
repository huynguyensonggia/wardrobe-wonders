import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "secret123",
    });
  }

  async validate(payload: any) {
    // payload.sub là user id (theo chuẩn JWT)
    return {
      id: payload.sub,          // ✅ quan trọng: để controller dùng req.user.id
      userId: payload.sub,      // ✅ giữ lại nếu code cũ đang dùng userId
      role: payload.role,
      email: payload.email,     // ✅ nếu token có email thì dùng được luôn
    };
  }
}
