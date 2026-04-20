import { IsString, IsObject, IsOptional } from "class-validator";

export class SubmitEvaluationDto {
  @IsString()
  cycleId: string;

  @IsString()
  formId: string;

  @IsString()
  targetId: string;

  @IsObject()
  answers: Record<string, unknown>;

  @IsString()
  @IsOptional()
  comment?: string;
}
