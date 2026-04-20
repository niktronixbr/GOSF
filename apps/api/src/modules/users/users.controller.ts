import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  findAll(@CurrentUser() user: any) {
    return this.usersService.findByInstitution(user.institutionId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.institutionId, dto);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.institutionId, dto);
  }

  @Patch(":id/toggle-status")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  toggleStatus(@Param("id") id: string, @CurrentUser() user: any) {
    return this.usersService.toggleStatus(id, user.institutionId);
  }
}
