import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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

function toNumberOrUndefined(v: any) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Khi dùng multipart/form-data, FE thường gửi variants là string JSON.
 * Hàm này sẽ parse + normalize về đúng dạng array.
 */
function normalizeVariants(raw: any) {
  if (!raw) return undefined;

  if (Array.isArray(raw)) return raw;

  // nếu FE gửi "variants" là JSON string
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
  constructor(private readonly productService: ProductService) {}

  // ✅ POST: tạo 1 product (ảnh optional) + variants
  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(new BadRequestException("Only image files are allowed"), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Product> {
    // normalize numbers (vì multipart/form-data => string)
    const dto: CreateProductDto = {
      ...body,
      categoryId: toNumberOrUndefined(body.categoryId) as any,
      rentPricePerDay: toNumberOrUndefined(body.rentPricePerDay) as any,
      deposit: toNumberOrUndefined(body.deposit) as any,
      variants: normalizeVariants(body.variants) as any,
    };

    // variants bắt buộc (theo DTO bạn muốn: nhiều size)
    if (!dto.variants || !Array.isArray(dto.variants) || dto.variants.length === 0) {
      throw new BadRequestException(
        "variants is required (example: [{\"size\":\"M\",\"stock\":2},{\"size\":\"L\",\"stock\":1}])",
      );
    }

    return this.productService.create(dto, file);
  }

  // ✅ IMPORT EXCEL: tạo nhiều products 1 lần
  @Post("import-excel")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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
  async importExcel(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Missing excel file (field name: file)");
    return this.productService.importFromExcel(file);
  }

  // ✅ PATCH: update 1 product (ảnh optional) + variants (optional)
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
  update(
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
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
      variants: normalizeVariants(body.variants) as any, // optional
    };

    return this.productService.update(productId, dto, file);
  }

  // ✅ DELETE
  @Delete(":id")
  remove(@Param("id") id: string): Promise<{ message: string }> {
    const productId = Number(id);
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new BadRequestException("Invalid id");
    }
    return this.productService.remove(productId);
  }
}
