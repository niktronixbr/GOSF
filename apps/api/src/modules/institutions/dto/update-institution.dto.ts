import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { InstitutionStatus } from "@gosf/database";

export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(InstitutionStatus)
  status?: InstitutionStatus;
}
