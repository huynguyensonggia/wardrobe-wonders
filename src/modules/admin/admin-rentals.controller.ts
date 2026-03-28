import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";

import { RentalsService } from "../rentals/rentals.service";
import { UpdateShippingDto } from "../rentals/dto/update-shipping.dto";
import { AddSurchargeDto } from "../rentals/dto/add-surcharge.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { UpdateRentalStatusDto } from "../rentals/dto/update-rental-status.dto";

@Controller("admin/rentals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminRentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.rentalsService.findAll(Number(page ?? 1), Number(pageSize ?? 20));
  }

  // ✅ PATCH /admin/rentals/:id/status
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateRentalStatusDto) {
    return this.rentalsService.update(Number(id), dto);
  }

  // ✅ PATCH /admin/rentals/:id/shipping
  @Patch(":id/shipping")
  updateShipping(@Param("id") id: string, @Body() dto: UpdateShippingDto) {
    return this.rentalsService.updateShipping(Number(id), dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<{ deleted: boolean }> {
    return this.rentalsService.remove(Number(id));
  }

  @Patch(":id/refund-deposit")
  refundDeposit(@Param("id") id: string) {
    return this.rentalsService.refundDeposit(Number(id));
  }

  // ✅ Thêm phí phát sinh
  @Post(":id/surcharges")
  addSurcharge(@Param("id") id: string, @Body() dto: AddSurchargeDto) {
    return this.rentalsService.addSurcharge(Number(id), dto);
  }

  // ✅ Ghi nhận ngày trả thực tế
  @Patch(":id/actual-return")
  setActualReturn(@Param("id") id: string, @Body("actualReturnDate") date: string) {
    return this.rentalsService.setActualReturnDate(Number(id), date);
  }

  // ✅ Kiểm tra availability theo ngày
  @Get("check-availability")
  checkAvailability(
    @Query("variantId") variantId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.rentalsService.checkAvailability(Number(variantId), startDate, endDate);
  }
}
