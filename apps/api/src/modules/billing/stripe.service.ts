import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.getOrThrow("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.getOrThrow("STRIPE_WEBHOOK_SECRET");
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}
