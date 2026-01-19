import { IsIn, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
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
