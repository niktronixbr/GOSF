import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class RegisterInstitutionDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug deve conter apenas letras minúsculas, números e hífens",
  })
  slug: string;

  @IsString()
  @MinLength(2)
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
