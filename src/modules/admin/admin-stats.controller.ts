import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { AdminService } from "./admin.service";

@Controller("admin") // => /api/admin
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats") // => GET /api/admin/stats
  getStats() {
    return this.adminService.getStats();
  }
}
