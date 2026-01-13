import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { VtonCategory } from './enums/vton-category.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) { }

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug.trim();
    if (!slug) throw new BadRequestException('slug is required');

    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new BadRequestException('slug already exists');

    const cat = this.repo.create({
      name: dto.name.trim(),
      slug,
      description: dto.description ?? null,
      vtonCategory: dto.vtonCategory ?? VtonCategory.DRESSES,
      isActive: dto.isActive ?? true,
    });

    return this.repo.save(cat);
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');

    // Kiểm tra slug unique nếu thay đổi
    if (dto.slug && dto.slug.trim() !== cat.slug) {
      const exists = await this.repo.findOne({ where: { slug: dto.slug.trim() } });
      if (exists) throw new BadRequestException('slug already exists');
    }

    // Update chỉ những field được gửi (partial)
    Object.assign(cat, {
      name: dto.name ? dto.name.trim() : cat.name,
      slug: dto.slug ? dto.slug.trim() : cat.slug,
      description: dto.description !== undefined ? dto.description : cat.description,
      vtonCategory: dto.vtonCategory ?? cat.vtonCategory,
      isActive: dto.isActive ?? cat.isActive,
    });

    return this.repo.save(cat);
  }

  async remove(id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.repo.remove(cat);
    return { deleted: true };
  }
}