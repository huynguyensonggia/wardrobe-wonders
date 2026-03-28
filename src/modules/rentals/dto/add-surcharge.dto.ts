import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { SurchargeType } from "../entities/rental-surcharge.entity";

export class AddSurchargeDto {
  @IsEnum(SurchargeType)
  type: SurchargeType;

  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
