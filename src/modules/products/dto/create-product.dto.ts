import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { ProductStatus } from "../enums/product-status.enum";
import { ProductOccasion } from "../enums/product-occasion.enum";
import { ProductSize } from "../enums/product-size.enum";

// ✅ DTO con cho 1 variant
export class CreateProductVariantDto {
  @IsEnum(ProductSize)
  size: ProductSize;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;
}

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

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // ✅ NEW: nhiều size + stock
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}
