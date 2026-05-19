import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import * as ExcelJS from "exceljs";

import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { Category } from "../categories/entities/category.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductStatus } from "./enums/product-status.enum";
import { ProductOccasion } from "./enums/product-occasion.enum";
import { ProductSize } from "./enums/product-size.enum";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class ProductService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async clearAllProducts(): Promise<{ deleted: number }> {
    const count = await this.productRepo.count();
    await this.dataSource.query("SET FOREIGN_KEY_CHECKS = 0");
    await this.dataSource.query("DELETE FROM inventory_items");
    await this.dataSource.query("DELETE FROM product_variants");
    await this.dataSource.query("DELETE FROM products");
    await this.dataSource.query("SET FOREIGN_KEY_CHECKS = 1");
    return { deleted: count };
  }

  async findAll(query?: {
    categoryId?: number;
    status?: ProductStatus;
    occasion?: string;
    search?: string;
  }) {
    const qb = this.productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "c")
      .leftJoinAndSelect("p.variants", "v")
      .orderBy("p.id", "DESC");

    if (query?.categoryId)
      qb.andWhere("c.id = :categoryId", { categoryId: query.categoryId });
    if (query?.status)
      qb.andWhere("p.status = :status", { status: query.status });
    if (query?.search) {
      const keyword = `%${query.search.trim()}%`;
      qb.andWhere(
        "(p.name LIKE :kw OR p.name_en LIKE :kw OR p.name_ja LIKE :kw OR p.description LIKE :kw)",
        { kw: keyword },
      );
    }
    if (query?.occasion) {
      const occasions = query.occasion
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      if (occasions.length === 1) {
        qb.andWhere("p.occasion = :occasion", { occasion: occasions[0] });
      } else if (occasions.length > 1) {
        qb.andWhere("p.occasion IN (:...occasions)", { occasions });
      }
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true, variants: true },
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
    if (v === null || v === undefined || v === "") return null;
    // Xử lý format số kiểu VN: "100.000" hoặc "100,000" → 100000
    const cleaned = String(v)
      .trim()
      .replace(/\./g, "") // bỏ dấu chấm phân cách hàng nghìn kiểu VN
      .replace(/,/g, ""); // bỏ dấu phẩy phân cách hàng nghìn kiểu EN
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  // Giá thuê = 40% giá nhập, làm tròn 1.000đ
  // Giá cọc  = 120% giá nhập, làm tròn 1.000đ
  private calcPrices(costPrice: number): { rentPricePerDay: number; deposit: number } {
    const price = Number(costPrice) || 0;
    return {
      rentPricePerDay: Math.round((price * 0.4) / 1000) * 1000,
      deposit: Math.round((price * 1.2) / 1000) * 1000,
    };
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

    if (params.excludeId)
      qb.andWhere("p.id != :excludeId", { excludeId: params.excludeId });

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
        'variants is required. Example: [{"size":"M","stock":2},{"size":"L","stock":1}]',
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
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category)
      throw new BadRequestException("Invalid categoryId - Category not found");

    const name = this.normalizeName(dto.name);
    if (!name) throw new BadRequestException("name is required");

    const occasion = this.normalizeOccasion(dto.occasion);
    if (!occasion) throw new BadRequestException("occasion is required");

    const color = this.normalizeColor(dto.color);

    this.validateVariants((dto as any).variants);

    await this.assertNoDuplicate({
      name,
      categoryId: dto.categoryId,
      occasion,
      color,
    });

    const directRentPrice = (dto as any).rentPricePerDay !== undefined
      ? Number((dto as any).rentPricePerDay)
      : null;
    const directDeposit = (dto as any).deposit !== undefined
      ? Number((dto as any).deposit)
      : null;
    const calcedPrices = this.calcPrices(dto.costPrice);
    const finalRentPrice = directRentPrice !== null && !dto.costPrice
      ? directRentPrice
      : calcedPrices.rentPricePerDay;
    const finalDeposit = directDeposit !== null && !dto.costPrice
      ? directDeposit
      : calcedPrices.deposit;

    const product = this.productRepo.create({
      name,
      category,
      categoryId: category.id,
      occasion: occasion as ProductOccasion,
      costPrice: dto.costPrice ?? 0,
      rentPricePerDay: finalRentPrice,
      deposit: finalDeposit,
      color,
      colorEn: dto.colorEn?.trim() ?? null,
      colorJa: dto.colorJa?.trim() ?? null,
      imageUrl: null,
      description: dto.description ?? null,
      nameEn: (dto as any).nameEn ?? null,
      nameJa: (dto as any).nameJa ?? null,
      descriptionEn: (dto as any).descriptionEn ?? null,
      descriptionJa: (dto as any).descriptionJa ?? null,
      shopeeUrl: (dto as any).shopeeUrl ?? null,
      status: dto.status ?? ProductStatus.AVAILABLE,
    });

    const saved = await this.productRepo.save(product);

    // variants
    const variants = (dto as any).variants.map((v: any) =>
      this.variantRepo.create({
        productId: saved.id,
        product: saved,
        size: v.size,
        sizeEn: v.sizeEn ?? null,
        sizeJa: v.sizeJa ?? null,
        stock: Number(v.stock),
        isActive: true,
      }),
    );
    const savedVariants = await this.variantRepo.save(variants);

    // Tự động tạo inventory items cho từng variant theo stock
    for (const sv of savedVariants) {
      const variantDto = (dto as any).variants.find(
        (v: any) => v.size === sv.size,
      );
      const stock = Number(variantDto?.stock ?? 0);
      const conditionNote = variantDto?.conditionNote ?? undefined;
      for (let i = 1; i <= stock; i++) {
        const barcode = `WW-${saved.id}-${sv.size}-${String(i).padStart(3, "0")}`;
        try {
          await this.inventoryService.create({
            variantId: sv.id,
            barcode,
            maxRentals: 50,
            conditionNote,
            skipStockUpdate: true, // stock đã set đúng khi tạo variant
          });
        } catch {
          /* barcode trùng → bỏ qua */
        }
      }
    }

    // image
    try {
      if (file) {
        const uploaded = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          {
            folder: `products/${saved.id}`,
            publicId: "main",
          },
        );
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      } else if (dto.imageUrl) {
        const uploaded = await this.cloudinaryService.uploadFromUrl(
          dto.imageUrl,
          {
            folder: `products/${saved.id}`,
            publicId: "main",
          },
        );
        await this.productRepo.update(saved.id, { imageUrl: uploaded.url });
      }
      return this.findOne(saved.id);
    } catch (e: any) {
      await this.productRepo.delete(saved.id);
      throw new BadRequestException(
        `Failed to create product: ${e?.message ?? e}`,
      );
    }
  }

  // ================= UPDATE =================
  async update(id: number, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category)
        throw new BadRequestException(
          "Invalid categoryId - Category not found",
        );
      product.category = category;
      product.categoryId = category.id;
    }

    const nextName =
      dto.name !== undefined ? this.normalizeName(dto.name) : product.name;
    const nextOccasion =
      dto.occasion !== undefined
        ? this.normalizeOccasion(dto.occasion)
        : product.occasion;
    const nextColor =
      dto.color !== undefined ? this.normalizeColor(dto.color) : product.color;

    const categoryIdForDup =
      dto.categoryId !== undefined ? dto.categoryId : product.categoryId;

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
    if ((dto as any).costPrice !== undefined) {
      const prices = this.calcPrices(Number((dto as any).costPrice));
      product.costPrice = Number((dto as any).costPrice);
      product.rentPricePerDay = prices.rentPricePerDay;
      product.deposit = prices.deposit;
    } else {
      // phụ kiện: admin nhập thẳng rentPricePerDay / deposit
      if ((dto as any).rentPricePerDay !== undefined) {
        product.rentPricePerDay = Number((dto as any).rentPricePerDay) || 0;
      }
      if ((dto as any).deposit !== undefined) {
        product.deposit = Number((dto as any).deposit) || 0;
      }
    }
    if (dto.color !== undefined) product.color = nextColor;
    if (dto.colorEn !== undefined) product.colorEn = dto.colorEn?.trim() ?? null;
    if (dto.colorJa !== undefined) product.colorJa = dto.colorJa?.trim() ?? null;
    if (dto.description !== undefined) product.description = dto.description;
    if ((dto as any).nameEn !== undefined)
      product.nameEn = (dto as any).nameEn ?? null;
    if ((dto as any).nameJa !== undefined)
      product.nameJa = (dto as any).nameJa ?? null;
    if ((dto as any).descriptionEn !== undefined)
      product.descriptionEn = (dto as any).descriptionEn ?? null;
    if ((dto as any).descriptionJa !== undefined)
      product.descriptionJa = (dto as any).descriptionJa ?? null;
    if ((dto as any).shopeeUrl !== undefined)
      product.shopeeUrl = (dto as any).shopeeUrl ?? null;
    if (dto.status !== undefined) product.status = dto.status;

    await this.productRepo.save(product);

    // variants (optional update)
    if ((dto as any).variants !== undefined) {
      this.validateVariants((dto as any).variants);

      // Lấy variants hiện tại
      const existingVariants = await this.variantRepo.find({
        where: { productId: id },
      });

      // Tìm variant nào đang được tham chiếu bởi rental_items → không được xóa cứng
      const referencedIds = new Set<number>();
      for (const v of existingVariants) {
        const inUse = await this.variantRepo.manager
          .getRepository("rental_items")
          .findOne({ where: { variantId: v.id } } as any);
        if (inUse) referencedIds.add(v.id);
      }

      // Xóa cứng các variant chưa được tham chiếu
      const deletableIds = existingVariants
        .filter((v) => !referencedIds.has(v.id))
        .map((v) => v.id);
      if (deletableIds.length > 0) {
        await this.variantRepo.delete(deletableIds);
      }

      // Variant đang được tham chiếu → set inactive + stock = 0
      for (const vid of referencedIds) {
        await this.variantRepo.update(vid, {
          isActive: false as any,
          stock: 0,
        });
      }

      // Tạo variants mới từ dto
      const newSizes = new Set(
        (dto as any).variants.map((v: any) => String(v.size)),
      );

      // Nếu size mới trùng với variant đang bị referenced → reactivate thay vì tạo mới
      for (const vid of referencedIds) {
        const existing = existingVariants.find((v) => v.id === vid);
        if (existing && newSizes.has(existing.size)) {
          const dtoVariant = (dto as any).variants.find(
            (v: any) => String(v.size) === existing.size,
          );
          await this.variantRepo.update(vid, {
            isActive: true as any,
            stock: Number(dtoVariant.stock),
            sizeEn: dtoVariant.sizeEn ?? null,
            sizeJa: dtoVariant.sizeJa ?? null,
          } as any);
          newSizes.delete(existing.size); // đã xử lý, không tạo mới
        }
      }

      // Tạo mới các size chưa tồn tại
      const toCreate = (dto as any).variants
        .filter((v: any) => newSizes.has(String(v.size)))
        .map((v: any) =>
          this.variantRepo.create({
            productId: id,
            product,
            size: v.size,
            sizeEn: v.sizeEn ?? null,
            sizeJa: v.sizeJa ?? null,
            stock: Number(v.stock),
            isActive: true,
          }),
        );
      if (toCreate.length > 0) await this.variantRepo.save(toCreate);
    }

    // image (optional)
    if (file) {
      const uploaded = await this.cloudinaryService.uploadBuffer(file.buffer, {
        folder: `products/${id}`,
        publicId: "main",
      });
      await this.productRepo.update(id, { imageUrl: uploaded.url });
    } else if (dto.imageUrl !== undefined && dto.imageUrl) {
      const uploaded = await this.cloudinaryService.uploadFromUrl(
        dto.imageUrl,
        {
          folder: `products/${id}`,
          publicId: "main",
        },
      );
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
  async importFromExcel(file: Express.Multer.File, clearFirst = false) {
    if (clearFirst) {
      await this.clearAllProducts();
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(file.buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException("Excel has no sheets");

    // Build header map from first row
    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim() : "";
    });

    const rows: Record<string, any>[] = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const r: Record<string, any> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) r[header] = cell.value ?? null;
      });
      rows.push(r);
    });

    if (!rows.length) throw new BadRequestException("Excel is empty");

    // preload categories
    const categories = await this.categoryRepo.find();
    const categoryMap = new Map<number, Category>(
      categories.map((c) => [c.id, c]),
    );

    const success: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowIndex = i + 2;

      try {
        const name = this.normalizeName(r.name);
        if (!name) throw new BadRequestException("name is required");

        const categoryId = this.toNumber(r.categoryId);
        if (!categoryId)
          throw new BadRequestException("categoryId is required");

        const category = categoryMap.get(categoryId);
        if (!category)
          throw new BadRequestException(`Category ${categoryId} not found`);

        const occasion = this.normalizeOccasion(r.occasion);
        if (!occasion) throw new BadRequestException("occasion is required");

        const color = this.normalizeColor(r.color);
        const colorEn = r.colorEn ? String(r.colorEn).trim() : null;
        const colorJa = r.colorJa ? String(r.colorJa).trim() : null;

        const costPrice = this.toNumber(r.costPrice ?? r.cost_price);
        if (costPrice === null)
          throw new BadRequestException("costPrice is required");

        const { rentPricePerDay, deposit } = this.calcPrices(costPrice);

        const statusRaw = (r.status ?? "").toString().trim();
        const status = !statusRaw
          ? ProductStatus.AVAILABLE
          : Object.values(ProductStatus).includes(statusRaw as any)
            ? (statusRaw as any)
            : (() => {
                throw new BadRequestException(`status invalid: ${statusRaw}`);
              })();

        const description = r.description ?? null;
        const imageUrl = r.imageUrl ?? null;
        const nameEn = r.nameEn ? String(r.nameEn).trim() : null;
        const nameJa = r.nameJa ? String(r.nameJa).trim() : null;
        const descriptionEn = r.descriptionEn
          ? String(r.descriptionEn).trim()
          : null;
        const descriptionJa = r.descriptionJa
          ? String(r.descriptionJa).trim()
          : null;
        const shopeeUrl = r.shopeeUrl ? String(r.shopeeUrl).trim() : null;

        // variantsJson
        let variants: any[] = [];
        if (r.variantsJson) {
          variants =
            typeof r.variantsJson === "string"
              ? JSON.parse(r.variantsJson)
              : r.variantsJson;
        }
        this.validateVariants(variants);

        await this.assertNoDuplicate({ name, categoryId, occasion, color });

        // create product
        const product = this.productRepo.create({
          name,
          category,
          categoryId,
          occasion: occasion as any,
          costPrice,
          rentPricePerDay,
          deposit,
          color,
          colorEn,
          colorJa,
          imageUrl: null,
          description,
          nameEn,
          nameJa,
          descriptionEn,
          descriptionJa,
          shopeeUrl,
          status,
        });

        const saved = await this.productRepo.save(product);

        // create variants
        const savedVariants = await this.variantRepo.save(
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

        // Tự động tạo inventory items theo stock của từng variant
        for (const variant of savedVariants) {
          const stockCount = Number(variant.stock ?? 0);
          for (let s = 0; s < stockCount; s++) {
            const barcode = `${saved.id}-${variant.id}-${s + 1}-${Date.now()}`;
            await this.inventoryService.create({
              variantId: variant.id,
              barcode,
              maxRentals: 50,
              skipStockUpdate: true,
            });
          }
        }

        // image (optional)
        if (imageUrl) {
          try {
            const uploaded = await this.cloudinaryService.uploadFromUrl(
              imageUrl,
              {
                folder: `products/${saved.id}`,
                publicId: "main",
              },
            );
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
      failed,
    };
  }
}
