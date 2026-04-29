import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SkipPlanGuard } from "../../common/decorators/skip-plan-guard.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { BillingService } from "./billing.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get("status")
  @SkipPlanGuard()
  getStatus(@CurrentUser() user: any) {
    return this.billing.getStatus(user.institutionId);
  }

  @Post("checkout")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createCheckout(@CurrentUser() user: any, @Body() dto: CreateCheckoutDto) {
    return this.billing.createCheckoutSession(user.institutionId, dto);
  }

  @Post("portal")
  @SkipPlanGuard()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createPortal(@CurrentUser() user: any) {
    return this.billing.createPortalSession(user.institutionId);
  }
}
