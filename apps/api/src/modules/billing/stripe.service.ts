import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  readonly client: StripeClient;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.getOrThrow("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): ReturnType<StripeClient["webhooks"]["constructEvent"]> {
    const secret = this.config.getOrThrow("STRIPE_WEBHOOK_SECRET");
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}
