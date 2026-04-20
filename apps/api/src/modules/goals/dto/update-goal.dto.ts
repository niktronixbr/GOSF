import { IsString, IsOptional, IsISO8601, IsEnum, MaxLength } from "class-validator";
import { GoalStatus } from "@gosf/database";

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}
