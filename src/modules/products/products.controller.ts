import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from "@nestjs/common";

import { ProductService } from "./products.service";
import { WatchlistService } from "./watchlist.service";
import { ProductStatus } from "./enums/product-status.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("products")
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly watchlistService: WatchlistService,
  ) {}

  // GET /products?categoryId=1&status=available&search=váy
  @Get()
  getAll(
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: ProductStatus,
    @Query("occasion") occasion?: string,
    @Query("search") search?: string,
  ) {
    return this.service.findAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: status || undefined,
      occasion: occasion || undefined,
      search: search || undefined,
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

  // GET /products/watchlist — danh sách sản phẩm yêu thích của user
  @Get("watchlist")
  @UseGuards(JwtAuthGuard)
  getWatchlist(@Request() req: any) {
    return this.watchlistService.findByUser(req.user.userId);
  }

  // GET /products/:id
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.service.findOne(Number(id));
  }

  // GET /products/:id/watch — check if current user is watching
  @Get(":id/watch")
  @UseGuards(JwtAuthGuard)
  async getWatch(@Param("id") id: string, @Request() req: any) {
    const watching = await this.watchlistService.isWatching(req.user.userId, Number(id));
    return { watching };
  }

  // POST /products/:id/watch — start watching
  @Post(":id/watch")
  @UseGuards(JwtAuthGuard)
  watch(@Param("id") id: string, @Request() req: any) {
    return this.watchlistService.watch(req.user.userId, Number(id));
  }

  // DELETE /products/:id/watch — stop watching
  @Delete(":id/watch")
  @UseGuards(JwtAuthGuard)
  unwatch(@Param("id") id: string, @Request() req: any) {
    return this.watchlistService.unwatch(req.user.userId, Number(id));
  }
}
