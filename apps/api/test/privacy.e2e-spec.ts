import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Privacy / LGPD (e2e)", () => {
  let app: NestFastifyApplication;
  let studentToken: string;
  let teacherToken: string;
  let coordinatorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [studentToken, teacherToken, coordinatorToken, adminToken] = await Promise.all([
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "admin").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── POST /privacy/consent ───────────────────────────────────────────────

  describe("POST /api/v1/privacy/consent", () => {
    it("cria ConsentRecord para STUDENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/consent",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          purpose: "terms-of-use",
          version: "e2e-test",
          accepted: true,
          userAgent: "jest-e2e",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.purpose).toBe("terms-of-use");
      expect(body.version).toBe("e2e-test");
      expect(body.accepted).toBe(true);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/consent",
        payload: { purpose: "x", version: "1", accepted: true },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 400 para payload inválido (accepted ausente)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/consent",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { purpose: "x", version: "1" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── GET /privacy/consent ────────────────────────────────────────────────

  describe("GET /api/v1/privacy/consent", () => {
    it("retorna consentimentos do próprio usuário", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/consent",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/consent",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /privacy/requests ──────────────────────────────────────────────

  describe("POST /api/v1/privacy/requests", () => {
    it("cria DataRequest do tipo ACCESS para STUDENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { type: "ACCESS", details: "Teste e2e" },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.type).toBe("ACCESS");
      expect(body.status).toBe("PENDING");
    });

    it("retorna 400 para tipo inválido", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { type: "INVALID_TYPE" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/requests",
        payload: { type: "ACCESS" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /privacy/requests/me ────────────────────────────────────────────

  describe("GET /api/v1/privacy/requests/me", () => {
    it("retorna as próprias solicitações", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests/me",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests/me",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /privacy/export ─────────────────────────────────────────────────

  describe("GET /api/v1/privacy/export", () => {
    it("retorna snapshot completo dos dados do STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/export",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("exportedAt");
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("consents");
      expect(body).toHaveProperty("dataRequests");
      expect(body).toHaveProperty("notifications");
      expect(body.user.email).toBeDefined();
    });

    it("retorna snapshot com teacherProfile para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/export",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("teacherProfile");
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/export",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /privacy/requests (admin) ───────────────────────────────────────

  describe("GET /api/v1/privacy/requests (admin/coordinator)", () => {
    it("ADMIN lista todas as solicitações da instituição", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      if (body.length > 0) {
        expect(body[0]).toHaveProperty("user");
        expect(body[0].user).toHaveProperty("email");
      }
    });

    it("COORDINATOR também consegue listar", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("filtra por status PENDING", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests?status=PENDING",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      for (const r of body) {
        expect(r.status).toBe("PENDING");
      }
    });

    it("STUDENT recebe 403", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("TEACHER recebe 403", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── PATCH /privacy/requests/:id/status ──────────────────────────────────

  describe("PATCH /api/v1/privacy/requests/:id/status", () => {
    it("ADMIN atualiza status para IN_PROGRESS e depois COMPLETED", async () => {
      const createRes = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { type: "PORTABILITY", details: "fluxo admin" },
      });
      expect(createRes.statusCode).toBe(201);
      const { id } = createRes.json();

      const startRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/privacy/requests/${id}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "IN_PROGRESS" },
      });
      expect(startRes.statusCode).toBe(200);
      expect(startRes.json().status).toBe("IN_PROGRESS");

      const completeRes = await app.inject({
        method: "PATCH",
        url: `/api/v1/privacy/requests/${id}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "COMPLETED" },
      });
      expect(completeRes.statusCode).toBe(200);
      const body = completeRes.json();
      expect(body.status).toBe("COMPLETED");
      expect(body.resolvedAt).toBeTruthy();
    });

    it("STUDENT recebe 403 ao tentar atualizar", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/privacy/requests/${fakeId}/status`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { status: "COMPLETED" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 404 para ID inexistente", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/privacy/requests/${fakeId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "COMPLETED" },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
