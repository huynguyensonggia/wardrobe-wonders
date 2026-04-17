import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class RecommendDto {
  @IsNumber()
  @Min(1)
  height: number; // cm

  @IsNumber()
  @Min(1)
  weight: number; // kg

  @IsOptional()
  @IsNumber()
  bust?: number; // cm

  @IsOptional()
  @IsNumber()
  waist?: number; // cm

  @IsOptional()
  @IsNumber()
  hips?: number; // cm

  @IsOptional()
  @IsString()
  favoriteColors?: string; // "hồng, đỏ đô"

  @IsOptional()
  @IsString()
  category?: string; // "Quần, Áo, Váy, Áo khoác"
}
