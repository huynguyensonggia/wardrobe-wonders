import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { ConditionStatus } from "./entities/inventory-item.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";

class CreateInventoryItemDto {
  @Type(() => Number) @IsInt() @IsPositive()
  variantId: number;

  @IsString() @MaxLength(100)
  barcode: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  maxRentals?: number;

  @IsOptional() @IsString() @MaxLength(500)
  conditionNote?: string;

  @IsOptional() @IsString()
  acquiredDate?: string;
}

class UpdateStatusDto {
  @IsEnum(ConditionStatus)
  status: ConditionStatus;

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

@Controller("admin/inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  // GET /admin/inventory?status=washing&variantId=1
  @Get()
  findAll(
    @Query("status") status?: ConditionStatus,
    @Query("variantId") variantId?: string,
  ) {
    return this.service.findAll({
      status,
      variantId: variantId ? Number(variantId) : undefined,
    });
  }

  // GET /admin/inventory/summary?variantId=1
  @Get("summary")
  getSummary(@Query("variantId") variantId?: string) {
    return this.service.getStockSummary(variantId ? Number(variantId) : undefined);
  }

  // GET /admin/inventory/retirement-candidates?threshold=40
  @Get("retirement-candidates")
  getRetirementCandidates(@Query("threshold") threshold?: string) {
    return this.service.getRetirementCandidates(threshold ? Number(threshold) : 40);
  }

  // GET /admin/inventory/barcode/:barcode
  @Get("barcode/:barcode")
  findByBarcode(@Param("barcode") barcode: string) {
    return this.service.findByBarcode(barcode);
  }

  // GET /admin/inventory/variant/:variantId
  @Get("variant/:variantId")
  findByVariant(@Param("variantId") variantId: string) {
    return this.service.findByVariant(Number(variantId));
  }

  // POST /admin/inventory
  @Post()
  create(@Body() dto: CreateInventoryItemDto) {
    return this.service.create(dto);
  }

  // PATCH /admin/inventory/:id/status
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(Number(id), dto.status, dto.note);
  }
}
