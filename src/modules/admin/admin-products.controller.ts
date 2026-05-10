import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import { ProductService } from "../products/products.service";
import { CreateProductDto } from "../products/dto/create-product.dto";
import { UpdateProductDto } from "../products/dto/update-product.dto";
import { Product } from "../products/entities/product.entity";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../modules/auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/entities/audit-log.entity";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

function toNumberOrUndefined(v: any) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeVariants(raw: any) {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(
    private readonly productService: ProductService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(new BadRequestException("Only image files are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<Product> {
    const dto: CreateProductDto = {
      ...body,
      categoryId: toNumberOrUndefined(body.categoryId) as any,
      rentPricePerDay: toNumberOrUndefined(body.rentPricePerDay) as any,
      deposit: toNumberOrUndefined(body.deposit) as any,
      variants: normalizeVariants(body.variants) as any,
    };

    if (!dto.variants || !Array.isArray(dto.variants) || dto.variants.length === 0) {
      throw new BadRequestException(
        "variants is required (example: [{\"size\":\"M\",\"stock\":2},{\"size\":\"L\",\"stock\":1}])",
      );
    }

    const result = await this.productService.create(dto, file);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.PRODUCT_CREATE,
      resourceType: "product",
      resourceId: result.id,
      newValue: { name: dto.name, categoryId: dto.categoryId },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post("import-excel")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok =
          file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.originalname.toLowerCase().endsWith(".xlsx");
        if (!ok) {
          return cb(new BadRequestException("Only .xlsx files are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  async importExcel(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() admin: any,
    @Req() req: any,
    @Query("clearFirst") clearFirst?: string,
  ) {
    if (!file) throw new BadRequestException("Missing excel file (field name: file)");
    const result = await this.productService.importFromExcel(file, clearFirst === "true");
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.PRODUCT_IMPORT,
      resourceType: "product",
      newValue: { fileName: file.originalname, imported: result.imported, failed: result.failed },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch(":id")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(new BadRequestException("Only image files are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<Product> {
    const productId = Number(id);
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new BadRequestException("Invalid id");
    }

    const dto: UpdateProductDto = {
      ...body,
      categoryId: toNumberOrUndefined(body.categoryId) as any,
      rentPricePerDay: toNumberOrUndefined(body.rentPricePerDay) as any,
      deposit: toNumberOrUndefined(body.deposit) as any,
      variants: normalizeVariants(body.variants) as any,
    };

    const result = await this.productService.update(productId, dto, file);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.PRODUCT_UPDATE,
      resourceType: "product",
      resourceId: productId,
      newValue: { name: dto.name, categoryId: dto.categoryId },
      ipAddress: req.ip,
    });
    return result;
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const productId = Number(id);
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new BadRequestException("Invalid id");
    }
    const result = await this.productService.remove(productId);
    await this.auditService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: AuditAction.PRODUCT_DELETE,
      resourceType: "product",
      resourceId: productId,
      ipAddress: req.ip,
    });
    return result;
  }
}
