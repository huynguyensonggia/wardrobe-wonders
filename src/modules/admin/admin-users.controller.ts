import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";

import { UsersService } from "../users/users.service";
import { UpdateUserDto } from "../users/dto/update-user.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../modules/auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/entities/audit-log.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.usersService.update(Number(id), dto);
    // Loại bỏ password khỏi log
    const { password, ...safeDto } = dto as any;
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.USER_UPDATE,
      resourceType: "user",
      resourceId: Number(id),
      newValue: safeDto,
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.usersService.remove(Number(id));
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.USER_DELETE,
      resourceType: "user",
      resourceId: Number(id),
      ipAddress: req.ip,
    });
    return result;
  }
}
