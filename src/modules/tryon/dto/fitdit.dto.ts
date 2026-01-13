import { IsInt, IsOptional, IsEnum, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { VtonCategory } from "@/modules/categories/enums/vton-category.enum";

export class FitditDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsOptional()
  @IsEnum(VtonCategory)
  category?: VtonCategory;

  @IsOptional()
  @IsString()
  resolution?: "768x1024" | "1152x1536" | "1536x2048";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  nSteps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  imageScale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numImages?: number;

  @IsOptional()
  offsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}
