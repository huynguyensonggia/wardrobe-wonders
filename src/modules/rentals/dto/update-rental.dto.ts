import { IsEnum, IsOptional, IsString } from "class-validator";
import { RentalStatus } from "../enums/rental-status.enum";

export class UpdateRentalDto {
  // Admin thường chỉ update status + note
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
