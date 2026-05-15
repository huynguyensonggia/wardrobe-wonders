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
  Req,
} from "@nestjs/common";

import { RentalsService } from "../rentals/rentals.service";
import { UpdateShippingDto } from "../rentals/dto/update-shipping.dto";
import { AddSurchargeDto } from "../rentals/dto/add-surcharge.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { UpdateRentalStatusDto } from "../rentals/dto/update-rental-status.dto";
import { RentalStatus } from "../rentals/enums/rental-status.enum";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/entities/audit-log.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("admin/rentals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminRentalsController {
  constructor(
    private readonly rentalsService: RentalsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("status") status?: string,
  ) {
    const statusEnum = Object.values(RentalStatus).includes(status as RentalStatus)
      ? (status as RentalStatus)
      : undefined;
    return this.rentalsService.findAll(Number(page ?? 1), Number(pageSize ?? 20), statusEnum);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateRentalStatusDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.rentalsService.update(Number(id), dto);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_STATUS_UPDATE,
      resourceType: "rental",
      resourceId: Number(id),
      newValue: { status: dto.status },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(":id/shipping")
  async updateShipping(
    @Param("id") id: string,
    @Body() dto: UpdateShippingDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.rentalsService.updateShipping(Number(id), dto);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_SHIPPING_UPDATE,
      resourceType: "rental",
      resourceId: Number(id),
      newValue: { ...dto },
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<{ deleted: boolean }> {
    const result = await this.rentalsService.remove(Number(id));
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_DELETE,
      resourceType: "rental",
      resourceId: Number(id),
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(":id/refund-deposit")
  async refundDeposit(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.rentalsService.refundDeposit(Number(id));
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_REFUND_DEPOSIT,
      resourceType: "rental",
      resourceId: Number(id),
      ipAddress: req.ip,
    });
    return result;
  }

  @Post(":id/surcharges")
  async addSurcharge(
    @Param("id") id: string,
    @Body() dto: AddSurchargeDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.rentalsService.addSurcharge(Number(id), dto);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_SURCHARGE_ADD,
      resourceType: "rental",
      resourceId: Number(id),
      newValue: { amount: dto.amount, type: dto.type, note: dto.note },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(":id/actual-return")
  async setActualReturn(
    @Param("id") id: string,
    @Body("actualReturnDate") date: string,
    @CurrentUser() admin: any,
    @Req() req: any,
  ) {
    const result = await this.rentalsService.setActualReturnDate(Number(id), date);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.RENTAL_ACTUAL_RETURN,
      resourceType: "rental",
      resourceId: Number(id),
      newValue: { actualReturnDate: date },
      ipAddress: req.ip,
    });
    return result;
  }

  @Get("check-availability")
  checkAvailability(
    @Query("variantId") variantId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.rentalsService.checkAvailability(Number(variantId), startDate, endDate);
  }
}
