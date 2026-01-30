import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as XLSX from "xlsx";

import { Product } from "./entities/product.entity";
import { Category } from "../categories/entities/category.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductStatus } from "./enums/product-status.enum";
import { ProductOccasion } from "./enums/product-occasion.enum";
import { ProductSize } from "./enums/product-size.enum";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";

@Injectable()
export class ProductService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) { }

  async findAll(query?: { categoryId?: number; status?: ProductStatus }) {
    const qb = this.productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "c")
      .orderBy("p.id", "DESC");

    if (query?.categoryId) {
      qb.andWhere("c.id = :categoryId", { categoryId: query.categoryId });
    }

    if (query?.status) {
      qb.andWhere("p.status = :status", { status: query.status });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  // ===== helpers =====
  private normalizeName(name: string) {
    return (name ?? "").trim();
  }

  private normalizeColor(color?: string) {
    return (color ?? "unknown").trim().toLowerCase();
  }

  private normalizeOccasion(occasion: any) {
    return (occasion ?? "").toString().trim();
  }

  private toNumber(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /** parse enum value by (value or key), case-insensitive */
  private parseEnum<T extends Record<string, string | number>>(
    enumObj: T,
    input: any,
    field: string,
  ): T[keyof T] {
    if (input === null || input === undefined || input === "") {
      throw new BadRequestException(`${field} is required`);
    }

    const raw = String(input).trim();

    // 1) direct match by value
    const values = Object.values(enumObj).map(String);
    const idxVal = values.findIndex((v) => v.toLowerCase() === raw.toLowerCase());
    if (idxVal >= 0) return Object.values(enumObj)[idxVal] as any;

    // 2) match by key
    const keys = Object.keys(enumObj);
    const idxKey = keys.findIndex((k) => k.toLowerCase() === raw.toLowerCase());
    if (idxKey >= 0) return (enumObj as any)[keys[idxKey]];

    throw new BadRequestException(
      `${field} invalid: "${raw}". Allowed: ${values.join(", ")}`,
    );
  }

  /**
   * Duplicate definition:
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
      .createQueryBuilder("p")
      .where("p.name = :name", { name: params.name })
      .andWhere("p.categoryId = :categoryId", { categoryId: params.categoryId })
      .andWhere("p.occasion = :occasion", { occasion: params.occasion })
      .andWhere("p.size = :size", { size: params.size })
      .andWhere("p.color = :color", { color: params.color });

    if (params.excludeId) {
      qb.andWhere("p.id != :excludeId", { excludeId: params.excludeId });
    }

    const dup = await qb.getOne();
    if (dup) {
      throw new BadRequestException(
        `Duplicate product: "${params.name}" already exists (same category/occasion/size/color).`,
      );
    }
  }

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category)
      throw new BadRequestException("Invalid categoryId - Category not found");

    const name = this.normalizeName(dto.name);
    if (!name) throw new BadRequestException("name is required");

    const occasion = this.normalizeOccasion((dto as any).occasion);
    if (!occasion) throw new BadRequestException("occasion is required");

    const color = this.normalizeColor(dto.color);

    await this.assertNoDuplicate({
      name,
      categoryId: dto.categoryId,
      occasion,
      size: dto.size,
      color,
    });

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
      if (file) {
        const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
          folder: `products/${saved.id}`,
          publicId: "main",
          resourceType: "image",
        });
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      } else if (dto.imageUrl) {
        const uploaded = await this.cloudinaryService.uploadFromUrl(dto.imageUrl, {
          folder: `products/${saved.id}`,
          publicId: "main",
        });
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      }

      return this.findOne(saved.id);
    } catch (e: unknown) {
      await this.productRepo.delete(saved.id);
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Failed to create product with image: ${msg}`);
    }
  }

  async update(id: number, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category)
        throw new BadRequestException("Invalid categoryId - Category not found");
      product.category = category;
      product.categoryId = category.id;
    }

    const nextName =
      dto.name !== undefined ? this.normalizeName(dto.name) : product.name;
    const nextOccasion =
      (dto as any).occasion !== undefined
        ? this.normalizeOccasion((dto as any).occasion)
        : (product as any).occasion;

    const nextColor =
      dto.color !== undefined ? this.normalizeColor(dto.color) : product.color;

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

      if (file) {
        const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
          folder: `products/${id}`,
          publicId: "main",
          resourceType: "image",
        });
        await this.productRepo.update(id, { imageUrl: uploaded.url });
      } else if (dto.imageUrl !== undefined) {
        const uploaded = await this.cloudinaryService.uploadFromUrl(dto.imageUrl, {
          folder: `products/${id}`,
          publicId: "main",
        });
        await this.productRepo.update(id, { imageUrl: uploaded.url });
      }

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

  // =============================
  // ✅ IMPORT EXCEL (.xlsx)
  // Sheet header recommended:
  // name, categoryId, occasion, size, color, rentPricePerDay, deposit, quantity, status, description, imageUrl
  // =============================
  async importFromExcel(file: Express.Multer.File) {
    const wb = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new BadRequestException("Excel has no sheets");

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });
    if (!rows.length) throw new BadRequestException("Excel is empty");

    // preload categories
    const categories = await this.categoryRepo.find();
    const categoryMap = new Map<number, Category>(categories.map((c) => [c.id, c]));

    const success: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowIndex = i + 2; // row 1 is header

      try {
        const name = this.normalizeName(r.name);
        if (!name) throw new BadRequestException("name is required");

        const categoryId = this.toNumber(r.categoryId);
        if (!categoryId) throw new BadRequestException("categoryId is required");

        const category = categoryMap.get(categoryId);
        if (!category) throw new BadRequestException(`Category ${categoryId} not found`);

        // enums (accept key or value, case-insensitive)
        const occasion = this.parseEnum(ProductOccasion, r.occasion, "occasion");
        const size = this.parseEnum(ProductSize, r.size, "size");

        // numbers
        const rentPricePerDay = this.toNumber(r.rentPricePerDay);
        if (rentPricePerDay === null) throw new BadRequestException("rentPricePerDay is required");

        const deposit = this.toNumber(r.deposit);
        if (deposit === null) throw new BadRequestException("deposit is required");

        const quantity = this.toNumber(r.quantity) ?? 1;

        // status optional
        const status =
          r.status === null || r.status === undefined || r.status === ""
            ? ProductStatus.AVAILABLE
            : this.parseEnum(ProductStatus, r.status, "status");

        const color = this.normalizeColor(r.color);
        const description = r.description ?? null;
        const imageUrl = r.imageUrl ?? null;

        // duplicate check
        await this.assertNoDuplicate({
          name,
          categoryId,
          occasion,
          size,
          color,
        });

        // create first
        const product = this.productRepo.create({
          name,
          category,
          categoryId,
          occasion: occasion as any,
          rentPricePerDay,
          deposit,
          size: size as any,
          color,
          quantity,
          imageUrl: null,
          description,
          status,
        });

        const saved = await this.productRepo.save(product);

        // upload image if provided (fail -> keep product, just warning)
        if (imageUrl) {
          try {
            const uploaded = await this.cloudinaryService.uploadFromUrl(imageUrl, {
              folder: `products/${saved.id}`,
              publicId: "main",
            });
            await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
          } catch (e) {
            console.log(`Row ${rowIndex}: image upload failed`, e);
          }
        }

        success.push({ row: rowIndex, id: saved.id, name });
      } catch (e: any) {
        failed.push({
          row: rowIndex,
          reason: e?.message ?? String(e),
          data: r,
        });
      }
    }

    return {
      total: rows.length,
      imported: success.length,
      failedCount: failed.length,
      success,
      failed, // list chi tiết lỗi
    };
  }
}
