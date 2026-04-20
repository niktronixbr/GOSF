import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { UserRole } from "@gosf/database";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
