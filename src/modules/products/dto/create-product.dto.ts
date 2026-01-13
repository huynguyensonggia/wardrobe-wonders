import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ProductSize } from '../enums/product-size.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum'; // ← import thêm

export class CreateProductDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  rentPricePerDay: number;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsEnum(ProductType)  // ← Bắt buộc, phải là "top", "bottom", hoặc "dress"
  type: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsInt()
  @Min(0)
  deposit: number;

  @IsEnum(ProductSize)
  size: ProductSize;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}