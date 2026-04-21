import { IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "@gosf/database";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
