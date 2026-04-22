import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PrivacyService } from "./privacy.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, DataRequestStatus } from "@gosf/database";
import { CreateConsentDto } from "./dto/create-consent.dto";
import { CreateDataRequestDto } from "./dto/create-data-request.dto";
import { UpdateDataRequestStatusDto } from "./dto/update-data-request-status.dto";

@Controller("privacy")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Post("consent")
  @HttpCode(HttpStatus.CREATED)
  recordConsent(@CurrentUser() user: any, @Body() dto: CreateConsentDto) {
    return this.privacyService.recordConsent(user.id, user.institutionId, dto);
  }

  @Get("consent")
  getMyConsents(@CurrentUser() user: any) {
    return this.privacyService.getMyConsents(user.id);
  }

  @Post("requests")
  @HttpCode(HttpStatus.CREATED)
  createDataRequest(@CurrentUser() user: any, @Body() dto: CreateDataRequestDto) {
    return this.privacyService.createDataRequest(user.id, user.institutionId, dto);
  }

  @Get("requests/me")
  getMyDataRequests(@CurrentUser() user: any) {
    return this.privacyService.getMyDataRequests(user.id);
  }

  @Get("export")
  exportMyData(@CurrentUser() user: any) {
    return this.privacyService.exportMyData(user.id);
  }

  @Get("requests")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  listDataRequests(
    @CurrentUser() user: any,
    @Query("status") status?: DataRequestStatus,
  ) {
    return this.privacyService.listDataRequests(user.institutionId, status);
  }

  @Patch("requests/:id/status")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  updateDataRequestStatus(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateDataRequestStatusDto,
  ) {
    return this.privacyService.updateDataRequestStatus(id, user.institutionId, dto);
  }
}
