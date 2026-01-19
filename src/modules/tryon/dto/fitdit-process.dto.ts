import { IsString } from "class-validator";
import { FitditDto } from "./fitdit.dto";

export class FitditProcessDto extends FitditDto {
  @IsString()
  jobId: string;
}
