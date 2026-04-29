import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";
import { StripeService } from "../src/modules/billing/stripe.service";
import { DatabaseService } from "../src/common/database/database.service";

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
        items: { data: [{ price: { id: "price_test" }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }] },
      }),
    },
  },
  constructWebhookEvent: jest.fn(),
};

describe("Billing (e2e)", () => {
  let app: NestFastifyApplication;
  let coordinatorToken: string;
  let studentToken: string;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await createTestApp([{ token: StripeService, value: mockStripeService }]);
    db = app.get(DatabaseService);
    [coordinatorToken, studentToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

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

  describe("POST /api/v1/billing/portal", () => {
    beforeAll(async () => {
      // Garante que a instituição não tem stripeCustomerId para testar o 400
      await db.institution.updateMany({
        where: { slug: "escola-demo" },
        data: { stripeCustomerId: null },
      });
    });

    it("retorna 400 se institution não tem stripeCustomerId", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/portal",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
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
      const fakeEvent: Record<string, any> = {
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
      const fakeEvent: Record<string, any> = {
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
