import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PaymentMethod } from "../../payments/enums/payment-method.enum";
import { PickupType } from "../entities/rental.entity";

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
  // ✅ SHIPPING INFO
  // =========================
  @IsNotEmpty({ message: "shipFullName is required" })
  @IsString()
  @MaxLength(100)
  shipFullName: string;

  @IsNotEmpty({ message: "shipPhone is required" })
  @IsString()
  @Matches(/^[0-9+\-\s]{7,20}$/, { message: "shipPhone must be a valid phone number" })
  @MaxLength(30)
  shipPhone: string;

  @IsNotEmpty({ message: "shipAddress is required" })
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

  // =========================
  // PAYMENT METHOD
  // =========================
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PickupType)
  pickupType?: PickupType;
}
