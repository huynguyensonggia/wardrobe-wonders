import { Body, Controller, Get, Post, Put, Request, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { UpdateUserDto } from "../users/dto/update-user.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("google")
  googleLogin(@Body("credential") credential: string) {
    return this.authService.googleLogin(credential);
  }

  // ✅ FE: GET /auth/profile
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    // req.user được set bởi JwtStrategy
    return this.usersService.findOne(Number(req.user.id));
  }

  // ✅ FE: PUT /auth/profile
  @UseGuards(JwtAuthGuard)
  @Put("profile")
  updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(Number(req.user.id), dto);
  }
}
