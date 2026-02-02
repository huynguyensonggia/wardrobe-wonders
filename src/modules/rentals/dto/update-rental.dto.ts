import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { RentalStatus } from "../enums/rental-status.enum";

export class UpdateRentalDto {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shipFullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  shipPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shipAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipNote?: string;
}
