import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as XLSX from "xlsx";

import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
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

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(query?: { categoryId?: number; status?: ProductStatus }) {
    const qb = this.productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "c")
      .leftJoinAndSelect("p.variants", "v")
      .orderBy("p.id", "DESC");

    if (query?.categoryId) qb.andWhere("c.id = :categoryId", { categoryId: query.categoryId });
    if (query?.status) qb.andWhere("p.status = :status", { status: query.status });

    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true, variants: true },
    });

    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
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

  /** name + category + occasion + color (KHÔNG size) */
  private async assertNoDuplicate(params: {
    name: string;
    categoryId: number;
    occasion: any;
    color: string;
    excludeId?: number;
  }) {
    const qb = this.productRepo
      .createQueryBuilder("p")
      .where("p.name = :name", { name: params.name })
      .andWhere("p.categoryId = :categoryId", { categoryId: params.categoryId })
      .andWhere("p.occasion = :occasion", { occasion: params.occasion })
      .andWhere("p.color = :color", { color: params.color });

    if (params.excludeId) qb.andWhere("p.id != :excludeId", { excludeId: params.excludeId });

    const dup = await qb.getOne();
    if (dup) {
      throw new BadRequestException(
        `Duplicate product: "${params.name}" already exists (same category/occasion/color).`,
      );
    }
  }

  private validateVariants(variants: any) {
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new BadRequestException(
        "variants is required. Example: [{\"size\":\"M\",\"stock\":2},{\"size\":\"L\",\"stock\":1}]",
      );
    }

    const seen = new Set<string>();
    for (const v of variants) {
      if (!v?.size) throw new BadRequestException("variant.size is required");

      const stock = Number(v.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        throw new BadRequestException("variant.stock must be a number >= 0");
      }
      if (seen.has(v.size)) {
        throw new BadRequestException(`Duplicate variant size: ${v.size}`);
      }
      seen.add(v.size);
    }
  }

  // ================= CREATE =================
  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException("Invalid categoryId - Category not found");

    const name = this.normalizeName(dto.name);
    if (!name) throw new BadRequestException("name is required");

    const occasion = this.normalizeOccasion(dto.occasion);
    if (!occasion) throw new BadRequestException("occasion is required");

    const color = this.normalizeColor(dto.color);

    this.validateVariants((dto as any).variants);

    await this.assertNoDuplicate({ name, categoryId: dto.categoryId, occasion, color });

    const product = this.productRepo.create({
      name,
      category,
      categoryId: category.id,
      occasion: occasion as ProductOccasion,
      rentPricePerDay: dto.rentPricePerDay,
      deposit: dto.deposit,
      color,
      imageUrl: null,
      description: dto.description ?? null,
      status: dto.status ?? ProductStatus.AVAILABLE,
    });

    const saved = await this.productRepo.save(product);

    // variants
    const variants = (dto as any).variants.map((v: any) =>
      this.variantRepo.create({
        productId: saved.id,
        product: saved,
        size: v.size,
        stock: Number(v.stock),
        isActive: true,
      }),
    );
    await this.variantRepo.save(variants);

    // image
    try {
      if (file) {
        const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
          folder: `products/${saved.id}`,
          publicId: "main",
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
    } catch (e: any) {
      await this.productRepo.delete(saved.id);
      throw new BadRequestException(`Failed to create product: ${e?.message ?? e}`);
    }
  }

  // ================= UPDATE =================
  async update(id: number, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException("Invalid categoryId - Category not found");
      product.category = category;
      product.categoryId = category.id;
    }

    const nextName = dto.name !== undefined ? this.normalizeName(dto.name) : product.name;
    const nextOccasion =
      dto.occasion !== undefined ? this.normalizeOccasion(dto.occasion) : product.occasion;
    const nextColor = dto.color !== undefined ? this.normalizeColor(dto.color) : product.color;

    const categoryIdForDup = dto.categoryId !== undefined ? dto.categoryId : product.categoryId;

    const isKeyChanged =
      nextName !== product.name ||
      nextOccasion !== product.occasion ||
      nextColor !== product.color ||
      categoryIdForDup !== product.categoryId;

    if (isKeyChanged) {
      await this.assertNoDuplicate({
        name: nextName,
        categoryId: categoryIdForDup,
        occasion: nextOccasion,
        color: nextColor,
        excludeId: id,
      });
    }

    if (dto.name !== undefined) product.name = nextName;
    if (dto.occasion !== undefined) product.occasion = nextOccasion as any;
    if (dto.rentPricePerDay !== undefined) product.rentPricePerDay = dto.rentPricePerDay;
    if (dto.deposit !== undefined) product.deposit = dto.deposit;
    if (dto.color !== undefined) product.color = nextColor;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.status !== undefined) product.status = dto.status;

    await this.productRepo.save(product);

    // variants (optional update)
    if ((dto as any).variants !== undefined) {
      this.validateVariants((dto as any).variants);

      await this.variantRepo.delete({ productId: id });

      const variants = (dto as any).variants.map((v: any) =>
        this.variantRepo.create({
          productId: id,
          product,
          size: v.size,
          stock: Number(v.stock),
          isActive: true,
        }),
      );
      await this.variantRepo.save(variants);
    }

    // image (optional)
    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
        folder: `products/${id}`,
        publicId: "main",
      });
      await this.productRepo.update(id, { imageUrl: uploaded.url });
    } else if (dto.imageUrl !== undefined && dto.imageUrl) {
      const uploaded = await this.cloudinaryService.uploadFromUrl(dto.imageUrl, {
        folder: `products/${id}`,
        publicId: "main",
      });
      await this.productRepo.update(id, { imageUrl: uploaded.url });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.productRepo.delete({ id });
    return { message: `Product with ID ${id} deleted successfully` };
  }

  // =============================
  // ✅ IMPORT EXCEL (.xlsx) - hỗ trợ variants
  // Header gợi ý:
  // name, categoryId, occasion, color, rentPricePerDay, deposit, status, description, imageUrl, variantsJson
  // variantsJson: [{"size":"S","stock":2},{"size":"M","stock":1}]
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
      const rowIndex = i + 2;

      try {
        const name = this.normalizeName(r.name);
        if (!name) throw new BadRequestException("name is required");

        const categoryId = this.toNumber(r.categoryId);
        if (!categoryId) throw new BadRequestException("categoryId is required");

        const category = categoryMap.get(categoryId);
        if (!category) throw new BadRequestException(`Category ${categoryId} not found`);

        const occasion = this.normalizeOccasion(r.occasion);
        if (!occasion) throw new BadRequestException("occasion is required");

        const color = this.normalizeColor(r.color);

        const rentPricePerDay = this.toNumber(r.rentPricePerDay);
        if (rentPricePerDay === null) throw new BadRequestException("rentPricePerDay is required");

        const deposit = this.toNumber(r.deposit);
        if (deposit === null) throw new BadRequestException("deposit is required");

        const statusRaw = (r.status ?? "").toString().trim();
        const status =
          !statusRaw ? ProductStatus.AVAILABLE
          : (Object.values(ProductStatus).includes(statusRaw as any)
              ? (statusRaw as any)
              : (() => { throw new BadRequestException(`status invalid: ${statusRaw}`); })());

        const description = r.description ?? null;
        const imageUrl = r.imageUrl ?? null;

        // variantsJson
        let variants: any[] = [];
        if (r.variantsJson) {
          variants = typeof r.variantsJson === "string" ? JSON.parse(r.variantsJson) : r.variantsJson;
        }
        this.validateVariants(variants);

        await this.assertNoDuplicate({ name, categoryId, occasion, color });

        // create product
        const product = this.productRepo.create({
          name,
          category,
          categoryId,
          occasion: occasion as any,
          rentPricePerDay,
          deposit,
          color,
          imageUrl: null,
          description,
          status,
        });

        const saved = await this.productRepo.save(product);

        // create variants
        await this.variantRepo.save(
          variants.map((v) =>
            this.variantRepo.create({
              productId: saved.id,
              product: saved,
              size: v.size,
              stock: Number(v.stock),
              isActive: true,
            }),
          ),
        );

        // image (optional)
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
        failed.push({ row: rowIndex, reason: e?.message ?? String(e), data: r });
      }
    }

    return {
      total: rows.length,
      imported: success.length,
      failedCount: failed.length,
      success,
      failed,
    };
  }
}
