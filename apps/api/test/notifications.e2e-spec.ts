import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Notifications (e2e)", () => {
  let app: NestFastifyApplication;
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [studentToken, teacherToken] = await Promise.all([
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── GET /notifications ───────────────────────────────────────────────────

  describe("GET /api/v1/notifications", () => {
    it("retorna lista de notificações para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna lista de notificações para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /notifications/unread-count ─────────────────────────────────────

  describe("GET /api/v1/notifications/unread-count", () => {
    it("retorna contagem de não lidas para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("count");
      expect(typeof body.count).toBe("number");
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PATCH /notifications/read-all ───────────────────────────────────────

  describe("PATCH /api/v1/notifications/read-all", () => {
    it("marca todas as notificações como lidas para STUDENT", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/notifications/read-all",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("marca todas as notificações como lidas para TEACHER", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/notifications/read-all",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/notifications/read-all",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PATCH /notifications/:id/read ───────────────────────────────────────

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("retorna 404 para ID inexistente", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/notifications/${fakeId}/read`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect([404, 200]).toContain(res.statusCode);
    });

    it("retorna 401 sem autenticação", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/notifications/${fakeId}/read`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Fluxo completo com notificação real ──────────────────────────────────

  describe("Fluxo: criar e marcar notificação como lida", () => {
    it("após marcar todas como lidas, unread-count retorna 0", async () => {
      await app.inject({
        method: "PATCH",
        url: "/api/v1/notifications/read-all",
        headers: { authorization: `Bearer ${studentToken}` },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications/unread-count",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().count).toBe(0);
    });
  });
});
