import { IsEnum, IsOptional, IsString } from "class-validator";
import { RentalStatus } from "../enums/rental-status.enum";

export class UpdateRentalStatusDto {
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
