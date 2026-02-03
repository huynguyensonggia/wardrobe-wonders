import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FitditService } from "./fitdit.service";
import { FitditDto } from "./dto/fitdit.dto";
import { Product } from "../../modules/products/entities/product.entity";

function normalizeOffsets(body: FitditDto) {
  let raw: any = body.offsets ?? null;

  // fallback nếu FE gửi offsetsJson
  if (!raw && (body as any).offsetsJson) {
    try {
      raw = JSON.parse((body as any).offsetsJson);
    } catch {
      raw = null;
    }
  }

  const base = { top: 0, bottom: 0, left: 0, right: 0 };
  if (!raw || typeof raw !== "object") return base;

  return {
    top: Number.isFinite(+raw.top) ? +raw.top : 0,
    bottom: Number.isFinite(+raw.bottom) ? +raw.bottom : 0,
    left: Number.isFinite(+raw.left) ? +raw.left : 0,
    right: Number.isFinite(+raw.right) ? +raw.right : 0,
  };
}

@Controller("tryon")
export class TryonController {
  constructor(
    private readonly fitditService: FitditService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>
  ) {}

  // ✅ ONE-STEP: run mask (ẩn) + try-on (trả kết quả)
  // ✅ hỗ trợ: person file OR personUrl
  @Post("fitdit")
  @UseInterceptors(FileFieldsInterceptor([{ name: "person", maxCount: 1 }]))
  async runFitdit(
    @UploadedFiles() files: { person?: Express.Multer.File[] },
    @Body() body: FitditDto
  ) {
    const person = files?.person?.[0];

    const personUrl = String((body as any).personUrl || "").trim();

    // ✅ cho phép thiếu file nếu có personUrl
    if (!person && !personUrl) {
      throw new BadRequestException("Missing person image (file or personUrl)");
    }

    const productId = Number((body as any).productId);
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new BadRequestException("Invalid productId");
    }

    const product = await this.productRepo.findOne({
      where: { id: productId as any },
      relations: { category: true },
    });

    if (!product) throw new BadRequestException("Product not found");
    if (!product.category) throw new BadRequestException("Product has no category");

    const garmentUrl = product.imageUrl;
    if (!garmentUrl) {
      throw new BadRequestException("Product has no imageUrl to use as garment");
    }

    const vtonCategory = product.category.vtonCategory;
    const offsets = normalizeOffsets(body);

    return this.fitditService.process({
      person, // optional
      personUrl: personUrl || undefined, // ✅ tránh gửi ""
      garmentUrl,
      category: vtonCategory,
      offsets,
      resolution: (body as any).resolution ?? "768x1024",
      nSteps: (body as any).nSteps ?? 20,
      imageScale: (body as any).imageScale ?? 2,
      seed: (body as any).seed ?? -1,
      numImages: (body as any).numImages ?? 1,
    });
  }
}
