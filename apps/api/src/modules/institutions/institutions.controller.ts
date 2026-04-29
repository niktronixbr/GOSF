import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "@gosf/database";
import { InstitutionsService } from "./institutions.service";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { RegisterInstitutionDto } from "./dto/register-institution.dto";

@Controller("institutions")
export class InstitutionsController {
  constructor(private institutions: InstitutionsService) {}

  @Public()
  @Post("register")
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterInstitutionDto) {
    return this.institutions.register(dto);
  }

  @Get("me")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getMyInstitution(@CurrentUser() user: any) {
    return this.institutions.findById(user.institutionId);
  }

  @Patch("me")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  updateMyInstitution(@CurrentUser() user: any, @Body() dto: UpdateInstitutionDto) {
    return this.institutions.update(user.institutionId, dto);
  }
}
