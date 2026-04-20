import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Evaluations (e2e)", () => {
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

  // ─── GET /evaluations/cycles ──────────────────────────────────────────────

  describe("GET /api/v1/evaluations/cycles", () => {
    it("retorna lista de ciclos para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/cycles",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna lista de ciclos para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/cycles",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/cycles",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Ciclo CRUD (COORDINATOR) ─────────────────────────────────────────────

  describe("Ciclo CRUD (COORDINATOR)", () => {
    let cycleId: string;
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const cyclePayload = {
      title: `Ciclo E2E ${now.getTime()}`,
      startsAt: now.toISOString(),
      endsAt: future.toISOString(),
    };

    it("cria ciclo como COORDINATOR e retorna 201", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/evaluations/cycles",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: cyclePayload,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      expect(body.title).toBe(cyclePayload.title);
      expect(body.status).toBe("DRAFT");
      cycleId = body.id;
    });

    it("retorna 403 se STUDENT tentar criar ciclo", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/evaluations/cycles",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: cyclePayload,
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 400 ao criar ciclo sem título", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/evaluations/cycles",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { startsAt: now.toISOString(), endsAt: future.toISOString() },
      });
      expect(res.statusCode).toBe(400);
    });

    it("abre o ciclo criado (DRAFT → OPEN)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/evaluations/cycles/${cycleId}/open`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe("OPEN");
    });

    it("retorna 409 ao tentar abrir ciclo que já está OPEN", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/evaluations/cycles/${cycleId}/open`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: {},
      });
      expect(res.statusCode).toBe(409);
    });

    it("fecha o ciclo (OPEN → CLOSED)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/evaluations/cycles/${cycleId}/close`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe("CLOSED");
    });

    it("retorna o ciclo pelo ID", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/evaluations/cycles/${cycleId}`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(cycleId);
      expect(res.json().status).toBe("CLOSED");
    });
  });

  // ─── Ciclo ativo ──────────────────────────────────────────────────────────

  describe("GET /api/v1/evaluations/cycles/active", () => {
    it("retorna ciclo ativo ou null", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/cycles/active",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      // 200 com ciclo ou null
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── Formulários ──────────────────────────────────────────────────────────

  describe("GET /api/v1/evaluations/forms", () => {
    it("retorna formulários para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/forms",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna formulários para TEACHER (sem restrição de papel)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/evaluations/forms",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para POST /forms como STUDENT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/evaluations/forms",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { title: "teste", targetType: "TEACHER", questions: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
