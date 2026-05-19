import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  ForbiddenException,
  Request,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ADMIN: xem danh sách user
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // USER: chỉ xem chính mình; ADMIN xem ai cũng được
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: any) {
    const targetId = Number(id);
    const meId = Number(req.user?.id);
    const role = req.user?.role;

    const isAdmin = String(role).toUpperCase() === Role.ADMIN;
    if (!isAdmin && targetId !== meId) {
      throw new ForbiddenException("You can only view your own profile");
    }

    return this.usersService.findOne(targetId);
  }

  // ✅ USER: update profile (chỉ update chính mình), ADMIN update ai cũng được
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    const targetId = Number(id);
    const meId = Number(req.user?.id);
    const role = req.user?.role;

    const isAdmin = String(role).toUpperCase() === Role.ADMIN;
    if (!isAdmin && targetId !== meId) {
      throw new ForbiddenException("You can only update your own profile");
    }

    return this.usersService.update(targetId, dto);
  }

  // ADMIN: xoá user
  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(Number(id));
  }
}
