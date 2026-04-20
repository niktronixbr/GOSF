import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  findAll(@CurrentUser() user: any) {
    return this.usersService.findByInstitution(user.institutionId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
