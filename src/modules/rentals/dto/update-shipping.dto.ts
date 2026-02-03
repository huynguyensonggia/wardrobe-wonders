import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateShippingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shipFullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  shipPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipNote?: string;
}
