import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './enums/product-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly service: ProductService) {}

  // GET /products?categoryId=1&status=available
  @Get()
  getAll(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.service.findAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status || undefined,
    });
  }

  // GET /products/:id
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  // POST /products
  // @Roles(Role.ADMIN)
  // @Post()
  // create(@Body() dto: CreateProductDto) {
  //   return this.service.create(dto);
  // }

  // PATCH /products/:id
  // @Roles(Role.ADMIN)
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  //   return this.service.update(Number(id), dto);
  // }

  // DELETE /products/:id
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.service.remove(Number(id));
  // }
}
