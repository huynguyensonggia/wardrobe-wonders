import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) { }

  @Get()
  findAll(): Promise<Category[]> {
    return this.service.findAll(); // hoặc findAllActive()
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category> {
    return this.service.findOne(Number(id));
  }
}
