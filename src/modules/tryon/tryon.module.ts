import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CloudinaryModule } from "../../common/cloudinary/cloudinary.module";
import { FitditService } from "./fitdit.service";
import { TryonController } from "./tryon.controller";
import { Product } from "../../modules/products/entities/product.entity";

@Module({
  imports: [
    CloudinaryModule,
    TypeOrmModule.forFeature([Product]), // ✅ BẮT BUỘC
  ],
  providers: [FitditService],
  controllers: [TryonController],
})
export class TryonModule {}
