import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class RecommendDto {
  @IsNumber()
  @Min(1)
  height: number;

  @IsNumber()
  @Min(1)
  weight: number;

  @IsOptional()
  @IsNumber()
  bust?: number;

  @IsOptional()
  @IsNumber()
  waist?: number;

  @IsOptional()
  @IsNumber()
  hips?: number;

  @IsOptional()
  @IsString()
  favoriteColors?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  occasion?: string; // "wedding, party, casual"

  @IsOptional()
  @IsString()
  stylePreference?: string; // "elegant, feminine, modern"

  @IsOptional()
  @IsString()
  language?: string; // "vi", "en", "ja"
}
