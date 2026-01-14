import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ProductSize } from '../enums/product-size.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductOccasion } from '../enums/product-occasion.enum';

export class CreateProductDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentPricePerDay: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsEnum(ProductOccasion)
  occasion: ProductOccasion;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  deposit: number;

  @IsEnum(ProductSize)
  size: ProductSize;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
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
