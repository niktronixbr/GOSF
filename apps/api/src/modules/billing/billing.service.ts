import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InstitutionStatus } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";
import { StripeService } from "./stripe.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import Stripe from "stripe";

@Injectable()
export class BillingService {
  constructor(
    private db: DatabaseService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {}

  async getStatus(institutionId: string) {
    const institution = await this.db.institution.findUnique({
      where: { id: institutionId },
      select: {
        status: true,
        planName: true,
        billingInterval: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });
    if (!institution) throw new NotFoundException("Instituição não encontrada.");
    return institution;
  }

  async createCheckoutSession(institutionId: string, dto: CreateCheckoutDto) {
    const institution = await this.db.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, name: true, stripeCustomerId: true },
    });
    if (!institution) throw new NotFoundException("Instituição não encontrada.");

    const customerId = await this.getOrCreateCustomer(institution);
    const priceId = this.resolvePriceId(dto.planName, dto.interval);
    const webUrl = this.config.getOrThrow("WEB_URL");

    const session = await this.stripe.client.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${webUrl}/coordinator?billing=success`,
      cancel_url: `${webUrl}/pricing`,
      metadata: { institutionId, planName: dto.planName, interval: dto.interval },
    });

    return { url: session.url };
  }

  async createPortalSession(institutionId: string) {
    const institution = await this.db.institution.findUnique({
      where: { id: institutionId },
      select: { stripeCustomerId: true },
    });
    if (!institution?.stripeCustomerId) {
      throw new BadRequestException("Instituição não possui assinatura ativa.");
    }
    const webUrl = this.config.getOrThrow("WEB_URL");
    const session = await this.stripe.client.billingPortal.sessions.create({
      customer: institution.stripeCustomerId,
      return_url: `${webUrl}/coordinator/settings?tab=assinatura`,
    });
    return { url: session.url };
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException("Assinatura do webhook inválida.");
    }

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await this.onPaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await this.onPaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }

    return { received: true };
  }

  private async getOrCreateCustomer(institution: { id: string; name: string; stripeCustomerId: string | null }) {
    if (institution.stripeCustomerId) return institution.stripeCustomerId;
    const customer = await this.stripe.client.customers.create({
      name: institution.name,
      metadata: { institutionId: institution.id },
    });
    await this.db.institution.update({
      where: { id: institution.id },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  private resolvePriceId(planName: string, interval: string): string {
    const key = `STRIPE_PRICE_${planName.toUpperCase()}_${interval.toUpperCase()}`;
    const priceId = this.config.get<string>(key);
    if (!priceId) throw new BadRequestException(`Price ID não configurado: ${key}`);
    return priceId;
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { institutionId, planName, interval } = session.metadata ?? {};
    if (!institutionId) return;

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

    const subscription = subscriptionId
      ? await this.stripe.client.subscriptions.retrieve(subscriptionId)
      : null;

    const periodEnd = subscription?.items.data[0]?.current_period_end;

    await this.db.institution.update({
      where: { id: institutionId },
      data: {
        status: InstitutionStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: subscription?.items.data[0]?.price.id ?? null,
        planName: planName ?? null,
        billingInterval: interval ?? null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
  }

  private async onPaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
    if (!subscriptionId) return;

    const subscription = await this.stripe.client.subscriptions.retrieve(subscriptionId);
    const periodEnd = subscription.items.data[0]?.current_period_end;
    await this.db.institution.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        status: InstitutionStatus.ACTIVE,
      },
    });
  }

  private async onPaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
    if (!subscriptionId) return;

    await this.db.institution.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: InstitutionStatus.SUSPENDED },
    });
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.db.institution.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: InstitutionStatus.INACTIVE,
        stripeSubscriptionId: null,
        stripePriceId: null,
        planName: null,
        billingInterval: null,
        currentPeriodEnd: null,
      },
    });
  }
}
