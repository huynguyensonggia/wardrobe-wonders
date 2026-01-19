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
import { FitditProcessDto } from "./dto/fitdit-process.dto";
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
    private readonly productRepo: Repository<Product>,
  ) {}

  // ✅ Step 1: Run Mask
  @Post("fitdit/mask")
  @UseInterceptors(FileFieldsInterceptor([{ name: "person", maxCount: 1 }]))
  async runMask(
    @UploadedFiles() files: { person?: Express.Multer.File[] },
    @Body() body: FitditDto,
  ) {
    const person = files.person?.[0];
    if (!person) throw new BadRequestException("Missing person image");

    if (!body.productId || Number.isNaN(+body.productId)) {
      throw new BadRequestException("Invalid productId");
    }

    const product = await this.productRepo.findOne({
      where: { id: body.productId },
      relations: { category: true },
    });

    if (!product) throw new BadRequestException("Product not found");
    if (!product.category) throw new BadRequestException("Product has no category");

    const vtonCategory = product.category.vtonCategory;
    const offsets = normalizeOffsets(body);

    return this.fitditService.generateMask({
      person,
      category: vtonCategory,
      offsets,
    });
  }

  // ✅ Step 2: Run Try-On (now uses jobId from Step 1)
  @Post("fitdit/process")
  @UseInterceptors(FileFieldsInterceptor([{ name: "person", maxCount: 1 }]))
  async runProcess(
    @UploadedFiles() files: { person?: Express.Multer.File[] },
    @Body() body: FitditProcessDto,
  ) {
    const person = files.person?.[0];
    if (!person) throw new BadRequestException("Missing person image");

    if (!body.productId || Number.isNaN(+body.productId)) {
      throw new BadRequestException("Invalid productId");
    }

    if (!body.jobId || typeof body.jobId !== "string") {
      throw new BadRequestException("Missing jobId (run Step 1 first)");
    }

    const product = await this.productRepo.findOne({
      where: { id: body.productId },
      relations: { category: true },
    });

    if (!product) throw new BadRequestException("Product not found");
    if (!product.category) throw new BadRequestException("Product has no category");

    const garmentUrl = product.imageUrl;
    if (!garmentUrl) {
      throw new BadRequestException("Product has no imageUrl to use as garment");
    }

    return this.fitditService.process({
      jobId: body.jobId,
      person,
      garmentUrl,
      resolution: body.resolution ?? "768x1024",
      nSteps: body.nSteps ?? 20,
      imageScale: body.imageScale ?? 2,
      seed: body.seed ?? -1,
      numImages: body.numImages ?? 1,
    });
  }
}
