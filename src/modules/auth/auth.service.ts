import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);

    // Gửi email chào mừng (không block response nếu lỗi)
    this.mailService.sendWelcome(user.email, user.name).catch(() => {});

    return this.signToken(user);
  }

  async googleLogin(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException("Invalid Google token");

    const { email, name, sub: googleId } = payload;
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createGoogleUser({ email, name: name ?? email, googleId });
      this.mailService.sendWelcome(email, name ?? email).catch(() => {});
    }

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const isMatch = user.password
      ? await bcrypt.compare(dto.password, user.password)
      : false;
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    return this.signToken(user);
  }

  private signToken(user: any) {
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
