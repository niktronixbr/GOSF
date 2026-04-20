import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole, UserStatus } from "@gosf/database";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
