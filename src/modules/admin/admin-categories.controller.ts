import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { CategoriesService } from "../categories/categories.service";
import { CreateCategoryDto } from "../categories/dto/create-category.dto";
import { UpdateCategoryDto } from "../categories/dto/update-category.dto";
import { Category } from "../categories/entities/category.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../modules/auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/entities/audit-log.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<Category> {
    const result = await this.categoriesService.create(dto);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.CATEGORY_CREATE,
      resourceType: "category",
      resourceId: result.id,
      newValue: { name: dto.name, slug: dto.slug },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<Category> {
    const result = await this.categoriesService.update(Number(id), dto);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.CATEGORY_UPDATE,
      resourceType: "category",
      resourceId: Number(id),
      newValue: { name: dto.name, slug: dto.slug },
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
    const result = await this.categoriesService.remove(Number(id));
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.CATEGORY_DELETE,
      resourceType: "category",
      resourceId: Number(id),
      ipAddress: req.ip,
    });
    return result;
  }
}
