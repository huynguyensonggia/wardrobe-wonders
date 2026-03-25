import { IsDateString } from "class-validator";

export class ExtendRentalDto {
  @IsDateString()
  endDate: string;
}
