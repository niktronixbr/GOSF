import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Goals (e2e)", () => {
  let app: NestFastifyApplication;
  let studentToken: string;
  let teacherToken: string;
  let coordinatorToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [studentToken, teacherToken, coordinatorToken] = await Promise.all([
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
      loginAs(app, "coordinator").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── GET /goals ───────────────────────────────────────────────────────────

  describe("GET /api/v1/goals", () => {
    it("retorna lista de metas para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/goals",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── CRUD completo ────────────────────────────────────────────────────────

  describe("CRUD de metas (STUDENT)", () => {
    let goalId: string;
    const now = Date.now();

    it("cria uma meta e retorna 201", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: {
          title: `Meta E2E ${now}`,
          description: "Descrição de teste",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      expect(body.title).toBe(`Meta E2E ${now}`);
      goalId = body.id;
    });

    it("retorna 400 ao criar meta sem título", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { description: "Sem título" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 403 ao TEACHER tentar criar meta", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/goals",
        headers: { authorization: `Bearer ${teacherToken}` },
        payload: { title: "Meta do professor" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("atualiza a meta criada e retorna 200", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/goals/${goalId}`,
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { title: `Meta E2E Atualizada ${now}`, status: "IN_PROGRESS" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().title).toBe(`Meta E2E Atualizada ${now}`);
    });

    it("retorna 403 ao TEACHER tentar atualizar meta", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/goals/${goalId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
        payload: { title: "Tentativa indevida" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("exclui a meta criada e retorna 200", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/goals/${goalId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 404 ao tentar excluir meta já removida", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/goals/${goalId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("retorna 403 ao TEACHER tentar excluir meta", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/goals/${fakeId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
