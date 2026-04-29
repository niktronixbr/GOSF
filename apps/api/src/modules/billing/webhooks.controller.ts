import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import { RawBodyRequest } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { FastifyRequest } from "fastify";
import { BillingService } from "./billing.service";

@Controller("webhooks")
@SkipThrottle({ default: true, auth: true })
export class WebhooksController {
  constructor(private billing: BillingService) {}

  @Post("stripe")
  async handleStripe(
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Headers("stripe-signature") sig: string,
  ) {
    if (!sig) throw new BadRequestException("stripe-signature ausente.");
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException("rawBody não disponível.");
    return this.billing.handleWebhookEvent(rawBody, sig);
  }
}
