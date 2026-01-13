import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ProductService } from '../products/products.service'; // dùng service chung
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ProductStatus } from '../products/enums/product-status.enum';
import { Product } from '../products/entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/products') // → endpoint: /api/admin/products
@UseGuards(JwtAuthGuard, RolesGuard) // bảo vệ toàn bộ controller
@Roles(Role.ADMIN) // chỉ admin mới truy cập được
export class AdminProductsController {
    constructor(private readonly productService: ProductService) { }

    @Get()
    findAll(
        @Query('categoryId') categoryId?: string,
        @Query('status') status?: ProductStatus,  // ← sửa type ở đây
    ): Promise<Product[]> {
        return this.productService.findAll({
            categoryId: categoryId ? Number(categoryId) : undefined,
            status,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Product> {
        return this.productService.findOne(Number(id));
    }

    @Post()
    create(@Body() createProductDto: CreateProductDto): Promise<Product> {
        return this.productService.create(createProductDto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<Product> {
        return this.productService.update(Number(id), updateProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<{ message: string }> {
        return this.productService.remove(Number(id));
    }
}