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

@Controller("tryon")
export class TryonController {
  constructor(
    private readonly fitditService: FitditService,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Post("fitdit")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "person", maxCount: 1 },
      { name: "garment", maxCount: 1 },
    ]),
  )
  async fitditTryOn(
    @UploadedFiles()
    files: {
      person?: Express.Multer.File[];
      garment?: Express.Multer.File[];
    },
    @Body() body: FitditDto,
  ) {
    const person = files.person?.[0];
    const garment = files.garment?.[0];

    if (!person || !garment) {
      throw new BadRequestException("Missing person or garment image");
    }

    if (!body.productId || Number.isNaN(+body.productId)) {
      throw new BadRequestException("Invalid productId");
    }

    // 1️⃣ lấy product
    const product = await this.productRepo.findOne({
      where: { id: body.productId },
      relations: { category: true },
    });

    if (!product) {
      throw new BadRequestException("Product not found");
    }
    if (!product.category) {
      throw new BadRequestException("Product has no category");
    }

    // 2️⃣ chọn category (FE override nếu có)
    const vtonCategory =
      body.category ?? product.category.vtonCategory;

    const offsets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      ...(body.offsets ?? {}),
    };

    // 3️⃣ gọi service
    return this.fitditService.run({
      person,
      garment,
      category: vtonCategory,
      resolution: body.resolution ?? "768x1024",
      nSteps: body.nSteps ?? 20,
      imageScale: body.imageScale ?? 2,
      seed: body.seed ?? -1,
      numImages: body.numImages ?? 1,
      offsets,
    });
  }
}
