import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";

import { RentalsService } from "../rentals/rentals.service";
import { UpdateRentalDto } from "../rentals/dto/update-rental.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard"; // ✅ chỉnh path giống dự án bạn
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";

@Controller("admin/rentals") // => /api/admin/rentals
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminRentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.rentalsService.findAll(Number(page ?? 1), Number(pageSize ?? 20));
  }

  // frontend bạn: PUT /admin/rentals/:id/status
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRentalDto,
  ) {
    return this.rentalsService.update(Number(id), dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<{ deleted: boolean }> {
    return this.rentalsService.remove(Number(id));
  }
}
