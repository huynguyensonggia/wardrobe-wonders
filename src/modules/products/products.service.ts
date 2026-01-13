import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './enums/product-status.enum';
import { ProductType } from './enums/product-type.enum'; // ← Đảm bảo import enum Type

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>, // ← Đổi tên repo cho rõ ràng (không dùng dressRepo)

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(query?: { categoryId?: number; status?: ProductStatus }) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .orderBy('p.id', 'DESC');

    if (query?.categoryId) {
      qb.andWhere('c.id = :categoryId', { categoryId: query.categoryId });
    }

    if (query?.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    // 1. Validate categoryId tồn tại
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new BadRequestException('Invalid categoryId - Category not found');
    }

    // 2. Tạo entity từ DTO (type-safe, fallback an toàn)
    const product = this.productRepo.create({
      name: dto.name,
      category, // TypeORM tự động map category_id
      type: dto.type, // ← Bắt buộc từ DTO
      rentPricePerDay: dto.rentPricePerDay,
      deposit: dto.deposit,
      size: dto.size,
      color: dto.color ?? 'unknown',
      quantity: dto.quantity ?? 1,
      imageUrl: dto.imageUrl ?? null,
      description: dto.description ?? null,
      status: dto.status ?? ProductStatus.AVAILABLE,
    });

    try {
      const savedProduct = await this.productRepo.save(product);
      return this.findOne(savedProduct.id); // Trả về full object với relations
    } catch (error) {
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    // 1. Tìm product hiện tại
    const product = await this.findOne(id);

    // 2. Nếu có categoryId → validate và update relation
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new BadRequestException('Invalid categoryId - Category not found');
      }
      product.category = category;
    }

    // 3. Update các field chỉ khi được gửi (partial update)
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.type !== undefined) product.type = dto.type; // ← Thêm update type
    if (dto.rentPricePerDay !== undefined) product.rentPricePerDay = dto.rentPricePerDay;
    if (dto.deposit !== undefined) product.deposit = dto.deposit;
    if (dto.size !== undefined) product.size = dto.size;
    if (dto.color !== undefined) product.color = dto.color;
    if (dto.quantity !== undefined) product.quantity = dto.quantity;
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.status !== undefined) product.status = dto.status;

    try {
      await this.productRepo.save(product);
      return this.findOne(id); // Trả về full object sau update
    } catch (error) {
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Kiểm tra tồn tại trước khi xóa
    await this.productRepo.delete({ id });
    return { message: `Product with ID ${id} deleted successfully` };
  }
}