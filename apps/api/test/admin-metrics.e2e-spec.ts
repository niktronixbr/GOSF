import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Admin Metrics (e2e)", () => {
  let app: NestFastifyApplication;
  let adminToken: string;
  let coordinatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [adminToken, coordinatorToken, studentToken] = await Promise.all([
      loginAs(app, "admin").then((r) => r.accessToken),
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe("GET /api/v1/admin/metrics", () => {
    it("retorna métricas para admin", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/metrics",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toMatchObject({
        users: {
          total: expect.any(Number),
          active: expect.any(Number),
          byRole: {
            STUDENT: expect.any(Number),
            TEACHER: expect.any(Number),
            COORDINATOR: expect.any(Number),
            ADMIN: expect.any(Number),
          },
        },
        cycles: {
          total: expect.any(Number),
          byStatus: {
            DRAFT: expect.any(Number),
            OPEN: expect.any(Number),
            CLOSED: expect.any(Number),
            ARCHIVED: expect.any(Number),
          },
        },
        evaluations: { totalSubmissions: expect.any(Number) },
        aiPlans: {
          studentPlans: expect.any(Number),
          teacherPlans: expect.any(Number),
        },
      });
    });

    it("retorna 403 para coordinator", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/metrics",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para student", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/metrics",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/admin/metrics",
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
