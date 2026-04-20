import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Users (e2e)", () => {
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

  // ─── /users/me ────────────────────────────────────────────────────────────

  describe("GET /api/v1/users/me", () => {
    it("retorna perfil do usuário autenticado (admin)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("role");
      expect(body.role).toBe("ADMIN");
    });

    it("retorna perfil correto para student", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().role).toBe("STUDENT");
    });

    it("retorna 401 sem token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 401 com token malformado", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: "Bearer token-invalido" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /users (ADMIN only) ──────────────────────────────────────────────

  describe("GET /api/v1/users", () => {
    it("retorna lista de usuários para ADMIN", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 403 para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /users (ADMIN only) ─────────────────────────────────────────────

  describe("POST /api/v1/users", () => {
    const newUser = {
      email: `e2e-test-${Date.now()}@test.com`,
      password: "Teste@1234",
      fullName: "Usuário E2E",
      role: "STUDENT",
    };

    let createdUserId: string;

    it("cria usuário como ADMIN e retorna 201", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: newUser,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      expect(body.email).toBe(newUser.email);
      createdUserId = body.id;
    });

    it("retorna 409 ao criar usuário com e-mail duplicado", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: newUser,
      });
      expect(res.statusCode).toBe(409);
    });

    it("retorna 403 para STUDENT tentando criar usuário", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { ...newUser, email: "outro@test.com" },
      });
      expect(res.statusCode).toBe(403);
    });

    afterAll(async () => {
      if (createdUserId) {
        await app.inject({
          method: "PATCH",
          url: `/api/v1/users/${createdUserId}/toggle-status`,
          headers: { authorization: `Bearer ${adminToken}` },
        });
      }
    });
  });
});
