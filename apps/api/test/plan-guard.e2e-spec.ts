import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";
import { DatabaseService } from "../src/common/database/database.service";

// Contador de IP para evitar que ThrottlerGuard bloqueie requisições nos testes
let reqCounter = 100;
function fakeIp() {
  const n = reqCounter++;
  return `10.1.${Math.floor(n / 256)}.${n % 256}`;
}

describe("PlanGuard (e2e)", () => {
  let app: NestFastifyApplication;
  let db: DatabaseService;
  let coordinatorToken: string;
  let studentToken: string;
  let adminToken: string;
  let institutionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DatabaseService);

    const institution = await db.institution.findUnique({
      where: { slug: "escola-demo" },
      select: { id: true },
    });
    if (!institution) throw new Error("Seed institution not found");
    institutionId = institution.id;

    // Garante que não há stripeCustomerId para o teste do portal
    await db.institution.update({
      where: { id: institutionId },
      data: { stripeCustomerId: null },
    });

    [coordinatorToken, studentToken, adminToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "admin").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await db.institution.update({
      where: { id: institutionId },
      data: { status: "TRIAL" },
    });
    await closeTestApp(app);
  });

  async function setStatus(status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE") {
    await db.institution.update({ where: { id: institutionId }, data: { status } });
  }

  // ─── TRIAL e ACTIVE têm acesso normal ─────────────────────────────────────

  describe("institution TRIAL", () => {
    beforeAll(() => setStatus("TRIAL"));

    it("coordinator acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });

    it("student acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("institution ACTIVE", () => {
    beforeAll(() => setStatus("ACTIVE"));

    it("coordinator acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── SUSPENDED bloqueia rotas de negócio ──────────────────────────────────

  describe("institution SUSPENDED", () => {
    beforeAll(() => setStatus("SUSPENDED"));

    it("coordinator recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(402);
    });

    it("student recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(402);
    });

    it("GET /billing/status retorna 200 (@SkipPlanGuard)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });

    it("POST /billing/portal retorna 400 (sem customer, mas não 402)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/portal",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(400);
    });

    it("ADMIN tem acesso mesmo com SUSPENDED (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${adminToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });

    it("rota pública /auth/login retorna 200 independente do status", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        headers: { "x-forwarded-for": fakeIp() },
        payload: {
          email: "coord@escolademo.com",
          password: "Admin@1234",
          institutionSlug: "escola-demo",
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it("rota sem autenticação retorna 401 (não 402)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── INACTIVE bloqueia rotas de negócio ───────────────────────────────────

  describe("institution INACTIVE", () => {
    beforeAll(() => setStatus("INACTIVE"));

    it("coordinator recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(402);
    });

    it("GET /billing/status retorna 200 (@SkipPlanGuard)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}`, "x-forwarded-for": fakeIp() },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
