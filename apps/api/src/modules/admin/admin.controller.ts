import { Controller, Get, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("metrics")
  getMetrics(@CurrentUser() user: any) {
    return this.admin.getMetrics(user.institutionId);
  }
}
