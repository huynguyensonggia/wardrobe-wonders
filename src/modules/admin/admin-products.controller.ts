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

@Controller("admin/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
    constructor(private readonly productService: ProductService) { }

    // ✅ POST: tạo 1 product (ảnh optional)
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
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<Product> {
        return this.productService.create(createProductDto, file);
    }

    // ✅ IMPORT EXCEL: tạo nhiều products 1 lần
    // POST /admin/products/import-excel
    // form-data:
    // - file: .xlsx
    @Post("import-excel")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024 }, // 20MB (excel lớn)
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

    // ✅ PATCH: update 1 product (ảnh optional)
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
        @Body() updateProductDto: UpdateProductDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<Product> {
        return this.productService.update(Number(id), updateProductDto, file);
    }

    // ✅ DELETE
    @Delete(":id")
    remove(@Param("id") id: string): Promise<{ message: string }> {
        return this.productService.remove(Number(id));
    }
}
