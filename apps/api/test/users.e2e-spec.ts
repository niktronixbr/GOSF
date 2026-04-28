import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Users (e2e)", () => {
  let app: NestFastifyApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    const auth = await loginAs(app, "student");
    token = auth.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe("GET /api/v1/users/me", () => {
    it("retorna 200 com dados do usuário autenticado", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toMatchObject({ email: "aluno@escolademo.com", role: "STUDENT" });
      expect(body.id).toBeDefined();
      expect(body.fullName).toBeDefined();
    });

    it("retorna 401 sem token", async () => {
      const res = await app.inject({ method: "GET", url: "/api/v1/users/me" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/v1/users/me", () => {
    it("atualiza fullName com sucesso (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { fullName: "Aluno Atualizado" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().fullName).toBe("Aluno Atualizado");
    });

    it("atualiza avatarUrl com URL válida (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { avatarUrl: "https://example.com/avatar.png" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().avatarUrl).toBe("https://example.com/avatar.png");
    });

    it("retorna 400 com avatarUrl inválida (não é URL)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { avatarUrl: "nao-e-uma-url" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("PATCH /api/v1/users/me/password", () => {
    it("retorna 401 com senha atual errada", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "SenhaErrada123", newPassword: "NovaSenha@1" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 400 com nova senha muito curta (menos de 6 chars)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@1234", newPassword: "123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("troca senha com sucesso (204) e restaura senha original", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@1234", newPassword: "Admin@5678_tmp" },
      });
      expect(res.statusCode).toBe(204);

      // Restaura a senha original para não quebrar outros testes
      const restore = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@5678_tmp", newPassword: "Admin@1234" },
      });
      expect(restore.statusCode).toBe(204);
    });
  });
});
