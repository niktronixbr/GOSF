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

  // ─── GET /users/me ────────────────────────────────────────────────────────

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
      const res = await app.inject({ method: "GET", url: "/api/v1/users/me" });
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

  // ─── PATCH /users/me ──────────────────────────────────────────────────────

  describe("PATCH /api/v1/users/me", () => {
    afterAll(async () => {
      // Restaura fullName original do seed (Maria Oliveira) para não poluir outros testes
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { fullName: "Maria Oliveira" },
      });
    });

    it("atualiza fullName com sucesso (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { fullName: "Aluno Atualizado" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().fullName).toBe("Aluno Atualizado");
    });

    it("atualiza avatarUrl com URL válida (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { avatarUrl: "https://example.com/avatar.png" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().avatarUrl).toBe("https://example.com/avatar.png");
    });

    it("retorna 400 com avatarUrl inválida (não é URL)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { avatarUrl: "nao-e-uma-url" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── PATCH /users/me/password ─────────────────────────────────────────────

  describe("PATCH /api/v1/users/me/password", () => {
    it("retorna 401 com senha atual errada", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { currentPassword: "SenhaErrada123", newPassword: "NovaSenha@1" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 400 com nova senha muito curta (menos de 6 chars)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { currentPassword: "Admin@1234", newPassword: "123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("troca senha com sucesso (204) e restaura senha original", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { currentPassword: "Admin@1234", newPassword: "Admin@5678_tmp" },
      });
      expect(res.statusCode).toBe(204);

      const restore = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { currentPassword: "Admin@5678_tmp", newPassword: "Admin@1234" },
      });
      expect(restore.statusCode).toBe(204);
    });
  });

  // ─── GET /users (ADMIN/COORDINATOR only) ──────────────────────────────────

  describe("GET /api/v1/users", () => {
    it("retorna lista paginada de usuários para ADMIN", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("retorna lista paginada para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
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
      const res = await app.inject({ method: "GET", url: "/api/v1/users" });
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
