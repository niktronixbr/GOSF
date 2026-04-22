import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Audit / LGPD rastreabilidade (e2e)", () => {
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

  // ─── GET /audit/logs (permissões) ─────────────────────────────────────────

  describe("GET /api/v1/audit/logs (autorização)", () => {
    it("ADMIN retorna 200 e array de logs", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("COORDINATOR retorna 200", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("TEACHER recebe 403", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("STUDENT recebe 403", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Filtros ──────────────────────────────────────────────────────────────

  describe("GET /api/v1/audit/logs (filtros)", () => {
    it("filtra por resourceType", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs?resourceType=privacy",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      for (const log of body) {
        expect(log.resourceType).toBe("privacy");
      }
    });

    it("filtra por action (case-insensitive, contém)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs?action=POST",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      for (const log of body) {
        expect(log.action.toUpperCase()).toContain("POST");
      }
    });

    it("filtra por intervalo de datas (from)", async () => {
      const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/audit/logs?from=${encodeURIComponent(from)}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });
  });

  // ─── AuditInterceptor ─────────────────────────────────────────────────────

  describe("AuditInterceptor (rastreamento automático)", () => {
    it("mutação POST /privacy/requests gera entrada no audit log", async () => {
      const createRes = await app.inject({
        method: "POST",
        url: "/api/v1/privacy/requests",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { type: "ACCESS", details: "audit-interceptor-test" },
      });
      expect(createRes.statusCode).toBe(201);

      // Dar tempo mínimo para o interceptor gravar (operação assíncrona best-effort)
      await new Promise((r) => setTimeout(r, 300));

      const logsRes = await app.inject({
        method: "GET",
        url: "/api/v1/audit/logs?resourceType=privacy",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(logsRes.statusCode).toBe(200);
      const logs = logsRes.json();
      const recent = logs.find(
        (l: { action: string; createdAt: string }) =>
          l.action.includes("POST") &&
          new Date(l.createdAt).getTime() > Date.now() - 1000 * 10,
      );
      expect(recent).toBeDefined();
    });
  });
});
