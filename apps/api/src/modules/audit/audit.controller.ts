import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";

@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINATOR)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get("logs")
  findAll(
    @CurrentUser() user: any,
    @Query("resourceType") resourceType?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditService.findAll(user.institutionId, { resourceType, action, from, to });
  }
}
