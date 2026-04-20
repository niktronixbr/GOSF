import { IsString, IsOptional, IsISO8601, MaxLength } from "class-validator";

export class CreateGoalDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}
