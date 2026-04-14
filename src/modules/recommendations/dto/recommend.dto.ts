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
  favoriteColors?: string; // "đen, trắng, đỏ"

  @IsOptional()
  @IsString()
  occasion?: string; // "tiệc, đi làm, casual"

  @IsOptional()
  @IsString()
  style?: string; // "thanh lịch, năng động, cổ điển"
}
