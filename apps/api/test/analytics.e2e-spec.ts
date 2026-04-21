import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Analytics (e2e)", () => {
  let app: NestFastifyApplication;
  let coordinatorToken: string;
  let studentToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [coordinatorToken, studentToken, teacherToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── Dashboard Student ────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/dashboard/student", () => {
    it("retorna dashboard para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/student",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/student",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/student",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/student",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Dashboard Teacher ────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/dashboard/teacher", () => {
    it("retorna dashboard para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/teacher",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/teacher",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/dashboard/teacher",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Teacher Student Insights ─────────────────────────────────────────────

  describe("GET /api/v1/analytics/teacher/students", () => {
    it("retorna insights de alunos para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teacher/students",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teacher/students",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Student History ──────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/student/history", () => {
    it("retorna histórico para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/student/history",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/student/history",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Student Feedbacks ────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/student/feedbacks", () => {
    it("retorna feedbacks para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/student/feedbacks",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/student/feedbacks",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Reports ─────────────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/reports", () => {
    it("retorna relatórios para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/reports",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/reports",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/reports",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Overview ─────────────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/overview", () => {
    it("retorna visão geral para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/overview",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/overview",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Benchmarking ─────────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/benchmarking", () => {
    it("retorna benchmarking para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/benchmarking",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/benchmarking",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Teachers with scores ─────────────────────────────────────────────────

  describe("GET /api/v1/analytics/teachers", () => {
    it("retorna lista de professores com scores para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teachers",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("aceita query params page e limit", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teachers?page=1&limit=5",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teachers",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Teacher Profile ──────────────────────────────────────────────────────

  describe("GET /api/v1/analytics/teachers/:teacherId/profile", () => {
    let teacherId: string;

    beforeAll(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/teachers?limit=1",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      const body = res.json();
      if (body.data && body.data.length > 0) {
        teacherId = body.data[0].teacher?.id ?? body.data[0].id;
      }
    });

    it("retorna perfil do professor para COORDINATOR", async () => {
      if (!teacherId) return;
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/analytics/teachers/${teacherId}/profile`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect([200, 404]).toContain(res.statusCode);
    });

    it("retorna 403 para TEACHER acessar perfil", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/analytics/teachers/${fakeId}/profile`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
