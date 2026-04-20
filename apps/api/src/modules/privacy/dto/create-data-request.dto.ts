import { IsEnum, IsOptional, IsString } from "class-validator";
import { DataRequestType } from "@gosf/database";

export class CreateDataRequestDto {
  @IsEnum(DataRequestType)
  type: DataRequestType;

  @IsOptional()
  @IsString()
  details?: string;
}
