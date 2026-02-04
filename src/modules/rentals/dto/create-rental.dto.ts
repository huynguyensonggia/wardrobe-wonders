import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class CreateRentalItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId: number;

  // ✅ NEW
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  variantId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateRentalDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRentalItemDto)
  items: CreateRentalItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  // =========================
  // ✅ SHIPPING INFO (NEW)
  // =========================
  @IsString()
  @MaxLength(100)
  shipFullName: string;

  @IsString()
  @MaxLength(30)
  shipPhone: string;

  @IsString()
  @MaxLength(200)
  shipAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shipAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipNote?: string;
}
