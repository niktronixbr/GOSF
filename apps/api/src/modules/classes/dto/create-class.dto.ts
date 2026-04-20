import { IsString, MinLength } from "class-validator";

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  academicPeriod: string;
}
