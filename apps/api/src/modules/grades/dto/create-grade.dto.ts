import { IsString, IsNumber, Min, Max, MinLength } from "class-validator";

export class CreateGradeDto {
  @IsString()
  studentId: string;

  @IsString()
  subjectId: string;

  @IsString()
  cycleId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsNumber()
  @Min(0.01)
  @Max(1)
  weight: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}
