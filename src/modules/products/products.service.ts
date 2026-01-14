import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './enums/product-status.enum';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

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

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  // ===== helpers =====
  private normalizeName(name: string) {
    return (name ?? '').trim();
  }

  private normalizeColor(color?: string) {
    return (color ?? 'unknown').trim().toLowerCase();
  }

  private normalizeOccasion(occasion: any) {
    // enum hoặc string đều ok
    return (occasion ?? '').toString().trim();
  }

  /**
   * Duplicate definition (bạn có thể đổi tiêu chí tại đây):
   * name + categoryId + occasion + size + color
   */
  private async assertNoDuplicate(params: {
    name: string;
    categoryId: number;
    occasion: any;
    size: any;
    color: string;
    excludeId?: number;
  }) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.name = :name', { name: params.name })
      .andWhere('p.categoryId = :categoryId', { categoryId: params.categoryId })
      .andWhere('p.occasion = :occasion', { occasion: params.occasion })
      .andWhere('p.size = :size', { size: params.size })
      .andWhere('p.color = :color', { color: params.color });

    if (params.excludeId) {
      qb.andWhere('p.id != :excludeId', { excludeId: params.excludeId });
    }

    const dup = await qb.getOne();
    if (dup) {
      throw new BadRequestException(
        `Duplicate product: "${params.name}" already exists (same category/occasion/size/color).`,
      );
    }
  }

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    // 0) validate category
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Invalid categoryId - Category not found');

    // 1) normalize + validate
    const name = this.normalizeName(dto.name);
    if (!name) throw new BadRequestException('name is required');

    const occasion = this.normalizeOccasion((dto as any).occasion);
    if (!occasion) throw new BadRequestException('occasion is required');

    const color = this.normalizeColor(dto.color);

    // 2) duplicate check BEFORE create (ngăn bấm tạo 2 lần)
    await this.assertNoDuplicate({
      name,
      categoryId: dto.categoryId,
      occasion,
      size: dto.size,
      color,
    });

    // 3) tạo product trước (để có id)
    const product = this.productRepo.create({
      name,
      category,
      categoryId: category.id,
      occasion: occasion as any,
      rentPricePerDay: dto.rentPricePerDay,
      deposit: dto.deposit,
      size: dto.size as any,
      color,
      quantity: dto.quantity ?? 1,
      imageUrl: null,
      description: dto.description ?? null,
      status: dto.status ?? ProductStatus.AVAILABLE,
    });

    const saved = await this.productRepo.save(product);

    try {
      // 4) upload image vào folder theo id
      if (file) {
        const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
          folder: `products/${saved.id}`,
          publicId: 'main',
          resourceType: 'image',
        });
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      } else if (dto.imageUrl) {
        const uploaded = await this.cloudinaryService.uploadFromUrl(dto.imageUrl, {
          folder: `products/${saved.id}`,
          publicId: 'main',
        });
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      }

      return this.findOne(saved.id);
    } catch (e: unknown) {
      // upload fail -> xoá record vừa tạo (tránh rác)
      await this.productRepo.delete(saved.id);
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Failed to create product with image: ${msg}`);
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    // 1) category đổi thì validate
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Invalid categoryId - Category not found');
      product.category = category;
      product.categoryId = category.id;
    }

    // 2) normalize fields (nếu gửi)
    const nextName = dto.name !== undefined ? this.normalizeName(dto.name) : product.name;
    const nextOccasion =
      (dto as any).occasion !== undefined
        ? this.normalizeOccasion((dto as any).occasion)
        : (product as any).occasion;

    const nextColor = dto.color !== undefined ? this.normalizeColor(dto.color) : product.color;

    // 3) nếu các field key có thay đổi -> check duplicate (exclude chính nó)
    const categoryIdForDup =
      dto.categoryId !== undefined ? dto.categoryId : product.categoryId;

    const sizeForDup = dto.size !== undefined ? dto.size : product.size;

    const isKeyChanged =
      nextName !== product.name ||
      nextOccasion !== (product as any).occasion ||
      nextColor !== product.color ||
      categoryIdForDup !== product.categoryId ||
      sizeForDup !== product.size;

    if (isKeyChanged) {
      await this.assertNoDuplicate({
        name: nextName,
        categoryId: categoryIdForDup,
        occasion: nextOccasion,
        size: sizeForDup,
        color: nextColor,
        excludeId: id,
      });
    }

    // 4) apply update (partial)
    if (dto.name !== undefined) product.name = nextName;
    if ((dto as any).occasion !== undefined) (product as any).occasion = nextOccasion;
    if (dto.rentPricePerDay !== undefined) product.rentPricePerDay = dto.rentPricePerDay;
    if (dto.deposit !== undefined) product.deposit = dto.deposit;
    if (dto.size !== undefined) product.size = dto.size as any;
    if (dto.color !== undefined) product.color = nextColor;
    if (dto.quantity !== undefined) product.quantity = dto.quantity;
    if (dto.imageUrl !== undefined) product.imageUrl = dto.imageUrl;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.status !== undefined) product.status = dto.status;

    try {
      await this.productRepo.save(product);
      return this.findOne(id);
    } catch (error: any) {
      throw new BadRequestException(`Failed to update product: ${error?.message ?? error}`);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.productRepo.delete({ id });
    return { message: `Product with ID ${id} deleted successfully` };
  }
}
