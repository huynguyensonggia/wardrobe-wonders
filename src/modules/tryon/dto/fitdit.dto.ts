import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class OffsetsDto {
  @Type(() => Number) @IsInt() top: number;
  @Type(() => Number) @IsInt() bottom: number;
  @Type(() => Number) @IsInt() left: number;
  @Type(() => Number) @IsInt() right: number;
}

export class FitditDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  // ✅ NEW: dùng khi mix lần 2 (base image = resultUrl lần trước)
  @IsOptional()
  @IsString()
  @IsUrl()
  personUrl?: string;

  @IsOptional()
  @IsIn(["768x1024", "1152x1536", "1536x2048"])
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
  @ValidateNested()
  @Type(() => OffsetsDto)
  offsets?: OffsetsDto;

  // fallback nếu FE gửi JSON string
  @IsOptional()
  @IsString()
  offsetsJson?: string;
}
