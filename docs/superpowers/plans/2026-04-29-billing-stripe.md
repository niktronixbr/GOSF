# Billing com Stripe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar billing SaaS com Stripe Checkout + Customer Portal, incluindo 3 planos em camadas (Starter/Escola/Enterprise), webhooks, página de preços pública e aba de assinatura no dashboard do coordinator.

**Architecture:** Módulo NestJS `billing` com StripeService (wrapper SDK), BillingService (lógica de negócio) e WebhooksController (sem JWT, validado por assinatura Stripe). Frontend com `/pricing` público, modificação do `/register` para aceitar query params de plano, e aba "Assinatura" no `/coordinator/settings`.

**Tech Stack:** `stripe` SDK (backend), Next.js 15 App Router, Tailwind, Prisma migration, NestJS Fastify com `rawBody: true`.

---

## Mapa de Arquivos

### Criar
- `apps/api/src/modules/billing/dto/create-checkout.dto.ts`
- `apps/api/src/modules/billing/stripe.service.ts`
- `apps/api/src/modules/billing/billing.service.ts`
- `apps/api/src/modules/billing/billing.controller.ts`
- `apps/api/src/modules/billing/webhooks.controller.ts`
- `apps/api/src/modules/billing/billing.module.ts`
- `apps/api/test/billing.e2e-spec.ts`
- `apps/web/src/lib/api/billing.ts`
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/components/pricing/PricingCards.tsx`

### Modificar
- `packages/database/prisma/schema.prisma` — 7 novos campos em Institution
- `apps/api/src/app.module.ts` — importar BillingModule
- `apps/api/src/main.ts` — habilitar `rawBody: true`
- `apps/api/src/modules/institutions/institutions.service.ts` — trialEndsAt no register()
- `apps/web/src/app/page.tsx` — link "Preços" no nav
- `apps/web/src/app/(auth)/register/page.tsx` — ler query params plan/interval
- `apps/web/src/app/(coordinator)/coordinator/settings/page.tsx` — aba Assinatura
- `apps/web/src/app/(coordinator)/coordinator/page.tsx` — banner billing=success

---

## Task 1: Instalar dependências do Stripe

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Instalar stripe no backend**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api && pnpm add stripe && cd ../..
```

Expected: `stripe` aparece em `apps/api/package.json` dependencies.

- [ ] **Step 2: Verificar instalação**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
grep '"stripe"' apps/api/package.json
```

Expected: `"stripe": "^X.X.X"`

---

## Task 2: Migração Prisma — campos de billing

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Adicionar campos ao model Institution**

Localizar o model `Institution` em `packages/database/prisma/schema.prisma` e adicionar os 7 campos após `settings`:

```prisma
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  planName             String?
  billingInterval      String?
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
```

O model completo deve ficar:

```prisma
model Institution {
  id        String            @id @default(cuid())
  name      String
  slug      String            @unique
  logoUrl   String?
  status    InstitutionStatus @default(TRIAL)
  settings  Json              @default("{}")
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  planName             String?
  billingInterval      String?
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  users            User[]
  classGroups      ClassGroup[]
  subjects         Subject[]
  evaluationCycles EvaluationCycle[]
  evaluationForms  EvaluationForm[]
  scoreAggregates  ScoreAggregate[]
  auditLogs        AuditLog[]
  consentRecords   ConsentRecord[]
  dataRequests     DataRequest[]

  @@map("institutions")
}
```

- [ ] **Step 2: Gerar e aplicar a migration**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx prisma migrate dev --name add-billing-fields --schema packages/database/prisma/schema.prisma
```

Expected: migration criada em `packages/database/prisma/migrations/` e aplicada com sucesso.

- [ ] **Step 3: Regenerar Prisma Client**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm db:generate
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add packages/database/prisma/
git commit -m "feat(db): adiciona campos de billing na Institution"
```

---

## Task 3: StripeService — wrapper do SDK

**Files:**
- Create: `apps/api/src/modules/billing/stripe.service.ts`

- [ ] **Step 1: Criar o StripeService**

Criar `apps/api/src/modules/billing/stripe.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.getOrThrow("STRIPE_SECRET_KEY"), {
      apiVersion: "2025-04-30.basil",
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.getOrThrow("STRIPE_WEBHOOK_SECRET");
    return this.client.webhooks.constructEvent(rawBody, signature, secret);
  }
}
```

---

## Task 4: DTO de checkout

**Files:**
- Create: `apps/api/src/modules/billing/dto/create-checkout.dto.ts`

- [ ] **Step 1: Criar o DTO**

Criar `apps/api/src/modules/billing/dto/create-checkout.dto.ts`:

```typescript
import { IsIn, IsString } from "class-validator";

export class CreateCheckoutDto {
  @IsString()
  @IsIn(["starter", "escola", "enterprise"])
  planName: string;

  @IsString()
  @IsIn(["month", "year"])
  interval: string;
}
```

---

## Task 5: BillingService — lógica de negócio

**Files:**
- Create: `apps/api/src/modules/billing/billing.service.ts`

- [ ] **Step 1: Criar o BillingService**

Criar `apps/api/src/modules/billing/billing.service.ts`:

```typescript
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

    const subscription = session.subscription
      ? await this.stripe.client.subscriptions.retrieve(session.subscription as string)
      : null;

    await this.db.institution.update({
      where: { id: institutionId },
      data: {
        status: InstitutionStatus.ACTIVE,
        stripeSubscriptionId: session.subscription as string | null,
        stripePriceId: subscription?.items.data[0]?.price.id ?? null,
        planName: planName ?? null,
        billingInterval: interval ?? null,
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });
  }

  private async onPaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
    if (!subscriptionId) return;

    const subscription = await this.stripe.client.subscriptions.retrieve(subscriptionId);
    await this.db.institution.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
```

---

## Task 6: BillingController — endpoints REST

**Files:**
- Create: `apps/api/src/modules/billing/billing.controller.ts`

- [ ] **Step 1: Criar o BillingController**

Criar `apps/api/src/modules/billing/billing.controller.ts`:

```typescript
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { BillingService } from "./billing.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get("status")
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createPortal(@CurrentUser() user: any) {
    return this.billing.createPortalSession(user.institutionId);
  }
}
```

---

## Task 7: WebhooksController — eventos Stripe

**Files:**
- Create: `apps/api/src/modules/billing/webhooks.controller.ts`

- [ ] **Step 1: Criar o WebhooksController**

Criar `apps/api/src/modules/billing/webhooks.controller.ts`:

```typescript
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
```

---

## Task 8: BillingModule + registrar no AppModule + habilitar rawBody

**Files:**
- Create: `apps/api/src/modules/billing/billing.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Criar o BillingModule**

Criar `apps/api/src/modules/billing/billing.module.ts`:

```typescript
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
```

- [ ] **Step 2: Importar BillingModule no AppModule**

Em `apps/api/src/app.module.ts`, adicionar import:

```typescript
import { BillingModule } from "./modules/billing/billing.module";
```

E incluir `BillingModule` no array `imports:` após `GoalsModule`:

```typescript
    GoalsModule,
    HealthModule,
    BillingModule,
```

- [ ] **Step 3: Habilitar rawBody no main.ts**

Em `apps/api/src/main.ts`, alterar a chamada de `NestFactory.create` para incluir `rawBody: true`:

```typescript
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true, rawBody: true }
  );
```

- [ ] **Step 4: Commit do módulo billing**

```bash
git add apps/api/src/modules/billing/ apps/api/src/app.module.ts apps/api/src/main.ts
git commit -m "feat(api): adiciona módulo billing com Stripe Checkout e webhooks"
```

---

## Task 9: InstitutionsService — trialEndsAt no register()

**Files:**
- Modify: `apps/api/src/modules/institutions/institutions.service.ts`

- [ ] **Step 1: Adicionar trialEndsAt ao criar institution**

Em `apps/api/src/modules/institutions/institutions.service.ts`, no método `register()`, alterar o `data:` do `institution.create`:

```typescript
    const institution = await this.db.institution.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        status: InstitutionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      select: { id: true, name: true, slug: true, status: true },
    });
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/institutions/institutions.service.ts
git commit -m "feat(api): define trialEndsAt de 14 dias ao registrar institution"
```

---

## Task 10: Testes e2e — billing.e2e-spec.ts

**Files:**
- Create: `apps/api/test/billing.e2e-spec.ts`

- [ ] **Step 1: Criar os testes e2e**

Criar `apps/api/test/billing.e2e-spec.ts`:

```typescript
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";
import { StripeService } from "../src/modules/billing/stripe.service";
import Stripe from "stripe";

const mockCheckoutUrl = "https://checkout.stripe.com/test-session";
const mockPortalUrl = "https://billing.stripe.com/test-portal";

const mockStripeService = {
  client: {
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_test123" }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: mockCheckoutUrl, subscription: null }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: mockPortalUrl }),
      },
    },
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        id: "sub_test123",
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: { data: [{ price: { id: "price_test" } }] },
      }),
    },
  },
  constructWebhookEvent: jest.fn(),
};

describe("Billing (e2e)", () => {
  let app: NestFastifyApplication;
  let coordinatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await createTestApp([{ token: StripeService, value: mockStripeService }]);
    [coordinatorToken, studentToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── GET /billing/status ───────────────────────────────────────────────────

  describe("GET /api/v1/billing/status", () => {
    it("retorna status de billing para usuário autenticado", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("planName");
      expect(body).toHaveProperty("trialEndsAt");
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({ method: "GET", url: "/api/v1/billing/status" });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /billing/checkout ────────────────────────────────────────────────

  describe("POST /api/v1/billing/checkout", () => {
    it("retorna URL de checkout para COORDINATOR", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/checkout",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { planName: "escola", interval: "month" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toHaveProperty("url", mockCheckoutUrl);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/checkout",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { planName: "escola", interval: "month" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 400 com planName inválido", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/checkout",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { planName: "invalido", interval: "month" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /billing/portal ──────────────────────────────────────────────────

  describe("POST /api/v1/billing/portal", () => {
    it("retorna 400 se institution não tem stripeCustomerId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/portal",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      // Sem customer, retorna 400
      expect(res.statusCode).toBe(400);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/portal",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── POST /webhooks/stripe ─────────────────────────────────────────────────

  describe("POST /api/v1/webhooks/stripe", () => {
    it("retorna 400 sem stripe-signature", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/webhooks/stripe",
        payload: JSON.stringify({ type: "checkout.session.completed" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 400 com assinatura inválida", async () => {
      mockStripeService.constructWebhookEvent.mockImplementationOnce(() => {
        throw new Error("Stripe signature verification failed.");
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/webhooks/stripe",
        payload: JSON.stringify({ type: "checkout.session.completed" }),
        headers: { "content-type": "application/json", "stripe-signature": "invalid" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("processa checkout.session.completed e retorna 201", async () => {
      const fakeEvent: Partial<Stripe.Event> = {
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { institutionId: "fake-id", planName: "escola", interval: "month" },
            subscription: null,
          } as any,
        },
      };
      mockStripeService.constructWebhookEvent.mockReturnValueOnce(fakeEvent);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/webhooks/stripe",
        payload: JSON.stringify(fakeEvent),
        headers: { "content-type": "application/json", "stripe-signature": "valid-sig" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ received: true });
    });

    it("processa invoice.payment_failed e retorna 201", async () => {
      const fakeEvent: Partial<Stripe.Event> = {
        type: "invoice.payment_failed",
        data: { object: { subscription: "sub_test999" } as any },
      };
      mockStripeService.constructWebhookEvent.mockReturnValueOnce(fakeEvent);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/webhooks/stripe",
        payload: JSON.stringify(fakeEvent),
        headers: { "content-type": "application/json", "stripe-signature": "valid-sig" },
      });
      expect(res.statusCode).toBe(201);
    });
  });
});
```

- [ ] **Step 2: Rodar os testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api test:e2e -- --testPathPattern billing
```

Expected: todos os testes passam.

- [ ] **Step 3: Commit**

```bash
git add apps/api/test/billing.e2e-spec.ts
git commit -m "test(e2e): adiciona testes de billing com Stripe mockado"
```

---

## Task 11: Frontend — lib/api/billing.ts

**Files:**
- Create: `apps/web/src/lib/api/billing.ts`

- [ ] **Step 1: Criar o wrapper de API**

Criar `apps/web/src/lib/api/billing.ts`:

```typescript
import { api } from "./client";

export interface BillingStatus {
  status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
  planName: string | null;
  billingInterval: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
}

export const billingApi = {
  getStatus: () => api.get<BillingStatus>("/billing/status"),

  createCheckoutSession: (planName: string, interval: string) =>
    api.post<{ url: string }>("/billing/checkout", { planName, interval }),

  createPortalSession: () =>
    api.post<{ url: string }>("/billing/portal", {}),
};
```

---

## Task 12: Frontend — PricingCards + /pricing/page.tsx

**Files:**
- Create: `apps/web/src/components/pricing/PricingCards.tsx`
- Create: `apps/web/src/app/pricing/page.tsx`

- [ ] **Step 1: Criar o componente PricingCards**

Criar `apps/web/src/components/pricing/PricingCards.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { billingApi } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";

const plans = [
  {
    name: "Starter",
    key: "starter",
    description: "Ideal para escolas em crescimento",
    limit: "até 50 usuários",
    priceMonth: 97,
    priceYear: 77,
    features: ["Avaliações colaborativas", "Planos de IA", "Análise por dimensão", "Suporte por e-mail"],
    popular: false,
    cta: "Começar agora",
  },
  {
    name: "Escola",
    key: "escola",
    description: "Para escolas estabelecidas",
    limit: "até 300 usuários",
    priceMonth: 297,
    priceYear: 237,
    features: ["Tudo do Starter", "Múltiplas turmas", "Relatórios avançados", "Benchmarking", "Suporte prioritário"],
    popular: true,
    cta: "Assinar Escola",
  },
  {
    name: "Enterprise",
    key: "enterprise",
    description: "Redes e grandes instituições",
    limit: "usuários ilimitados",
    priceMonth: 797,
    priceYear: 637,
    features: ["Tudo do Escola", "Multi-unidades", "SLA garantido", "Onboarding dedicado", "API personalizada"],
    popular: false,
    cta: "Falar com vendas",
  },
];

export function PricingCards() {
  const router = useRouter();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    if (planKey === "enterprise") {
      window.location.href = "mailto:contato@gosf.com.br?subject=Plano Enterprise GOSF";
      return;
    }
    setLoading(planKey);
    try {
      const { url } = await billingApi.createCheckoutSession(planKey, interval);
      window.location.href = url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/register?plan=${planKey}&interval=${interval}`);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Toggle mensal/anual */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setInterval("month")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            interval === "month"
              ? "bg-indigo-600 text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => setInterval("year")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            interval === "year"
              ? "bg-indigo-600 text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Anual
          <span className="ml-1.5 text-xs font-semibold text-emerald-600">-20%</span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-2xl border p-8 flex flex-col ${
              plan.popular
                ? "border-indigo-500 bg-indigo-50 shadow-lg"
                : "border-gray-200 bg-white shadow-sm"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">{plan.limit}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  R$ {interval === "month" ? plan.priceMonth : plan.priceYear}
                </span>
                <span className="text-sm text-gray-500 mb-1">/mês</span>
              </div>
              {interval === "year" && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  R$ {plan.priceYear * 12}/ano — economia de R$ {(plan.priceMonth - plan.priceYear) * 12}/ano
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-indigo-500 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.key)}
              disabled={loading === plan.key}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                plan.popular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {loading === plan.key ? "Aguarde..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        14 dias grátis no plano Starter. Sem cartão para começar.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Criar a página /pricing**

Criar `apps/web/src/app/pricing/page.tsx`:

```typescript
import { PricingCards } from "@/components/pricing/PricingCards";

export const metadata = {
  title: "Planos — GOSF",
  description: "Escolha o plano ideal para sua escola. 14 dias grátis, sem cartão.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Planos simples e transparentes
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Sem surpresas. Escolha o plano certo para o tamanho da sua escola e comece hoje.
          </p>
        </div>
        <PricingCards />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/pricing/ apps/web/src/app/pricing/
git commit -m "feat(web): adiciona página de preços pública /pricing"
```

---

## Task 13: Frontend — Link "Preços" no nav da landing page

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Adicionar link no nav**

Em `apps/web/src/app/page.tsx`, na função `Nav()`, adicionar o link "Preços" após os links existentes na `<nav>`:

```tsx
<nav className="hidden md:flex items-center gap-7 text-sm text-indigo-200">
  <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
  <a href="#how" className="hover:text-white transition-colors">Como funciona</a>
  <a href="#audience" className="hover:text-white transition-colors">Para quem</a>
  <Link href="/pricing" className="hover:text-white transition-colors">Preços</Link>
</nav>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat(web): adiciona link Preços no nav da landing page"
```

---

## Task 14: Frontend — /register com query params de plano

**Files:**
- Modify: `apps/web/src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Adicionar leitura de searchParams e auto-checkout pós-login**

No topo do arquivo `apps/web/src/app/(auth)/register/page.tsx`, adicionar:

```typescript
import { useSearchParams } from "next/navigation";
import { billingApi } from "@/lib/api/billing";
```

Dentro de `RegisterPage`, após `const router = useRouter();`, adicionar:

```typescript
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const intervalParam = searchParams.get("interval");
```

No bloco `onSubmit`, após o `login(tokens)` e antes do `router.push("/coordinator")`, adicionar:

```typescript
      if (planParam && intervalParam) {
        try {
          const { url } = await billingApi.createCheckoutSession(planParam, intervalParam);
          window.location.href = url;
          return;
        } catch {
          // Segue para o coordinator normalmente se checkout falhar
        }
      }
```

Acima do `<form>`, adicionar o banner de contexto de plano (quando `planParam` existe):

```tsx
        {planParam && (
          <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800">
            Você está assinando o plano{" "}
            <span className="font-semibold capitalize">{planParam}</span>
            {" "}— após o cadastro, você será redirecionado para o pagamento.
          </div>
        )}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(auth\)/register/page.tsx
git commit -m "feat(web): detecta plano selecionado em /register e inicia checkout pós-login"
```

---

## Task 15: Frontend — aba Assinatura em /coordinator/settings

**Files:**
- Modify: `apps/web/src/app/(coordinator)/coordinator/settings/page.tsx`

- [ ] **Step 1: Reescrever a página de settings com sistema de abas**

Substituir o conteúdo de `apps/web/src/app/(coordinator)/coordinator/settings/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "@/lib/api/coordinator";
import { billingApi, BillingStatus } from "@/lib/api/billing";
import { toast } from "sonner";
import { Save, Building2, CreditCard } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL", "SUSPENDED"]),
});

type FormValues = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  TRIAL: "Período de teste",
  SUSPENDED: "Suspensa",
};

const billingStatusConfig: Record<string, { label: string; className: string }> = {
  TRIAL: { label: "Em trial", className: "bg-yellow-100 text-yellow-800" },
  ACTIVE: { label: "Ativo", className: "bg-emerald-100 text-emerald-800" },
  SUSPENDED: { label: "Suspenso", className: "bg-red-100 text-red-800" },
  INACTIVE: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  escola: "Escola",
  enterprise: "Enterprise",
};

function SkeletonForm() {
  return (
    <div className="animate-pulse space-y-5 max-w-lg">
      <div className="h-9 rounded-lg bg-muted w-2/3" />
      <div className="h-9 rounded-lg bg-muted" />
      <div className="h-9 rounded-lg bg-muted w-1/2" />
      <div className="h-9 rounded-lg bg-muted w-1/3" />
    </div>
  );
}

function InstitutionForm() {
  const qc = useQueryClient();
  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution-settings"],
    queryFn: () => coordinatorApi.getInstitution(),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", status: "TRIAL" },
  });

  useEffect(() => {
    if (institution) reset({ name: institution.name, status: institution.status as FormValues["status"] });
  }, [institution, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => coordinatorApi.updateInstitution(values),
    onSuccess: (updated) => {
      toast.success("Configurações salvas com sucesso.");
      qc.setQueryData(["institution-settings"], updated);
      reset({ name: updated.name, status: updated.status as FormValues["status"] });
    },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  if (isLoading) return <SkeletonForm />;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Nome da instituição</label>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nome da instituição"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Slug</label>
          <input
            value={institution?.slug ?? ""}
            readOnly
            disabled
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">O slug é gerado automaticamente e não pode ser alterado.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground block">Status</label>
          <select
            {...register("status")}
            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isDirty || mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Save size={15} />
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function BillingTab() {
  const [portalLoading, setPortalLoading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => billingApi.getStatus(),
  });

  async function handleManage() {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch {
      toast.error("Erro ao abrir portal de gerenciamento.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (isLoading) return <SkeletonForm />;

  const billing = data as BillingStatus;
  const statusCfg = billingStatusConfig[billing.status] ?? billingStatusConfig.INACTIVE;

  return (
    <div className="space-y-4 max-w-lg">
      {billing.status === "SUSPENDED" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Sua assinatura está suspensa por falha no pagamento. Atualize seu método de pagamento para continuar usando o GOSF.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Plano atual</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {billing.planName ? planLabels[billing.planName] ?? billing.planName : "Trial"}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>

        {billing.billingInterval && (
          <p className="text-sm text-muted-foreground">
            Cobrança {billing.billingInterval === "month" ? "mensal" : "anual"}
          </p>
        )}

        {billing.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            Renova em {new Date(billing.currentPeriodEnd).toLocaleDateString("pt-BR")}
          </p>
        )}

        {billing.status === "TRIAL" && billing.trialEndsAt && (
          <p className="text-sm text-amber-700 font-medium">
            Trial encerra em {new Date(billing.trialEndsAt).toLocaleDateString("pt-BR")}
          </p>
        )}

        {billing.stripeSubscriptionId ? (
          <button
            onClick={handleManage}
            disabled={portalLoading}
            className="flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            <CreditCard size={15} />
            {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
          </button>
        ) : (
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Ver planos
          </a>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"geral" | "assinatura">(
    searchParams.get("tab") === "assinatura" ? "assinatura" : "geral"
  );

  function selectTab(tab: "geral" | "assinatura") {
    setActiveTab(tab);
    router.replace(`/coordinator/settings?tab=${tab}`, { scroll: false });
  }

  const tabs = [
    { key: "geral" as const, label: "Geral", icon: Building2 },
    { key: "assinatura" as const, label: "Assinatura", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Building2 size={24} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua instituição e assinatura.</p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-border flex gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "geral" ? <InstitutionForm /> : <BillingTab />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(coordinator\)/coordinator/settings/page.tsx
git commit -m "feat(web): adiciona aba Assinatura nas configurações do coordinator"
```

---

## Task 16: Frontend — banner billing=success no /coordinator

**Files:**
- Modify: `apps/web/src/app/(coordinator)/coordinator/page.tsx`

- [ ] **Step 1: Ler searchParam billing=success e exibir banner**

No início do arquivo `apps/web/src/app/(coordinator)/coordinator/page.tsx`, verificar se já tem `"use client"`. Se não tiver, a página pode ser Server Component — nesse caso, criar um componente separado `BillingSuccessBanner.tsx` que é Client Component.

Criar `apps/web/src/components/billing/BillingSuccessBanner.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function BillingSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        router.replace("/coordinator", { scroll: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 font-medium flex items-center gap-3">
      <span className="text-xl">🎉</span>
      Assinatura ativada com sucesso! Bem-vindo ao GOSF.
    </div>
  );
}
```

Em `apps/web/src/app/(coordinator)/coordinator/page.tsx`, importar e renderizar o banner no topo do conteúdo principal:

```typescript
import { BillingSuccessBanner } from "@/components/billing/BillingSuccessBanner";

// No JSX, antes do conteúdo principal:
<BillingSuccessBanner />
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/billing/ apps/web/src/app/\(coordinator\)/coordinator/page.tsx
git commit -m "feat(web): exibe banner de sucesso após checkout do Stripe"
```

---

## Task 17: Push final e variáveis de ambiente

- [ ] **Step 1: Verificar que todos os commits foram feitos**

```bash
git log --oneline -15
```

- [ ] **Step 2: Push para main**

```bash
git push origin main
```

- [ ] **Step 3: Configurar variáveis de ambiente no Easypanel**

No painel do Easypanel em `gosf-api`, adicionar as seguintes variáveis de ambiente:

```
STRIPE_SECRET_KEY=sk_test_...  (usar sk_test_ para testes, sk_live_ para produção)
STRIPE_WEBHOOK_SECRET=whsec_... (obtido em Stripe Dashboard > Webhooks)
STRIPE_PRICE_STARTER_MONTH=price_...
STRIPE_PRICE_STARTER_YEAR=price_...
STRIPE_PRICE_ESCOLA_MONTH=price_...
STRIPE_PRICE_ESCOLA_YEAR=price_...
STRIPE_PRICE_ENTERPRISE_MONTH=price_...
STRIPE_PRICE_ENTERPRISE_YEAR=price_...
```

No painel do Easypanel em `gosf-web`, adicionar:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- [ ] **Step 4: Registrar webhook no Stripe Dashboard**

No Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://gosf-api.niktronix.com.br/api/v1/webhooks/stripe`
- Eventos a escutar:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`

Copiar o `Signing secret` gerado para `STRIPE_WEBHOOK_SECRET`.

---

## Notas Técnicas Importantes

1. **rawBody + Fastify**: `rawBody: true` no `NestFactory.create` é a forma oficial (NestJS v10+). Se não funcionar, alternativa é adicionar em `main.ts` antes de `app.init()`:
   ```typescript
   const fastify = app.getHttpAdapter().getInstance();
   fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
     try { (req as any).rawBody = body; done(null, JSON.parse(body.toString())); }
     catch (e) { done(e as Error, undefined); }
   });
   ```

2. **Stripe apiVersion**: O SDK Stripe exige que a `apiVersion` no construtor corresponda a uma versão válida. Use `"2025-04-30.basil"` (mais recente com Stripe CLI v1.x) ou remova o campo e aceite o default do SDK.

3. **WEB_URL**: A variável `WEB_URL` já deve estar configurada no backend. Verificar que contém a URL completa sem trailing slash (ex: `https://gosf.niktronix.com.br`).

4. **Teste local**: Para testar webhooks localmente, usar `stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe` com o Stripe CLI. O `STRIPE_WEBHOOK_SECRET` para testes locais é exibido pelo CLI.
