import { IsBoolean, IsString, MinLength, IsOptional } from "class-validator";

export class CreateConsentDto {
  @IsString()
  @MinLength(1)
  purpose: string;

  @IsString()
  @MinLength(1)
  version: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
