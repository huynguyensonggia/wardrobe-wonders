import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';

// ✅ thêm import CloudinaryModule (đúng path theo project của bạn)
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
    CloudinaryModule, // ✅ thêm dòng này
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
