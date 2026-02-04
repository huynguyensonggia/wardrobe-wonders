import { Body, Controller, Get, Post, Put, Request, UseGuards } from "@nestjs/common";
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

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
