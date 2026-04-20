import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { TargetType, ResponseType } from "@gosf/database";

export class CreateQuestionDto {
  @IsString()
  dimension: string;

  @IsString()
  questionText: string;

  @IsEnum(ResponseType)
  responseType: ResponseType;

  @IsNumber()
  @Min(0)
  @Max(10)
  weight: number;

  @IsNumber()
  order: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class CreateFormDto {
  @IsEnum(TargetType)
  targetType: TargetType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
