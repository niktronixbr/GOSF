import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { InstitutionsService } from "./institutions.service";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";

@Controller("institutions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private institutions: InstitutionsService) {}

  @Get("me")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getMyInstitution(@CurrentUser() user: any) {
    return this.institutions.findById(user.institutionId);
  }

  @Patch("me")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  updateMyInstitution(@CurrentUser() user: any, @Body() dto: UpdateInstitutionDto) {
    return this.institutions.update(user.institutionId, dto);
  }
}
