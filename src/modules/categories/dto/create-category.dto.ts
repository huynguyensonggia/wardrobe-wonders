// src/modules/categories/dto/create-category.dto.ts
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { VtonCategory } from '../enums/vton-category.enum';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(VtonCategory)
  vtonCategory?: VtonCategory;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}