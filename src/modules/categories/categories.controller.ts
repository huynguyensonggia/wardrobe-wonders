import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

// Nếu bạn muốn bảo vệ route admin (tùy chọn)
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { Roles } from '../common/decorators/roles.decorator';
// import { Role } from '../common/enums/role.enum';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.service.findAll();
  }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard) // Bỏ comment nếu cần bảo vệ
  // @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.service.create(dto);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.service.remove(Number(id));
  }
}