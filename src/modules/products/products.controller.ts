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
    @Query("occasion") occasion?: string
  ) {
    return this.service.findAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status || undefined,
      occasion: occasion || undefined,
    });
  }

  // DEBUG: Kiểm tra dữ liệu đa ngôn ngữ
  @Get(":id/debug")
  async debugProduct(@Param("id") id: string) {
    const product = await this.service.findOne(Number(id));
    return {
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      nameJa: product.nameJa,
      description: product.description,
      descriptionEn: product.descriptionEn,
      descriptionJa: product.descriptionJa,
    };
  }

  // GET /products/:id
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.service.findOne(Number(id));
  }
}
