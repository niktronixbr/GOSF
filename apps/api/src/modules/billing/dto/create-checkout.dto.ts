import { IsIn, IsString } from "class-validator";

export class CreateCheckoutDto {
  @IsString()
  @IsIn(["starter", "escola", "enterprise"])
  planName: string;

  @IsString()
  @IsIn(["month", "year"])
  interval: string;
}
