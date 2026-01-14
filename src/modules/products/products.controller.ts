import { Controller, Get, Param, Query } from "@nestjs/common";

import { ProductService } from "./products.service";
import { ProductStatus } from "./enums/product-status.enum";

@Controller("products")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  // GET /products?categoryId=1&status=available
  @Get()
  getAll(
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: ProductStatus,
  ) {
    return this.service.findAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status || undefined,
    });
  }

  // GET /products/:id
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.service.findOne(Number(id));
  }
}
