import { IsString, IsDateString, MinLength } from "class-validator";

export class CreateCycleDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
