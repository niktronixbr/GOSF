import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { WebhooksController } from "./webhooks.controller";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";

@Module({
  controllers: [BillingController, WebhooksController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
