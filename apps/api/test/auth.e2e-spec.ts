import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs, SEED } from "./helpers/create-app";

describe("Auth (e2e)", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    it("retorna 200 e tokens com credenciais válidas (admin)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { ...SEED.admin, institutionSlug: SEED.institutionSlug },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("accessToken");
      expect(body).toHaveProperty("refreshToken");
      expect(typeof body.accessToken).toBe("string");
      expect(typeof body.refreshToken).toBe("string");
    });

    it("retorna 200 e tokens com credenciais válidas (coordinator)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { ...SEED.coordinator, institutionSlug: SEED.institutionSlug },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("accessToken");
    });

    it("retorna 200 e tokens com credenciais válidas (student)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { ...SEED.student, institutionSlug: SEED.institutionSlug },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("accessToken");
    });

    it("retorna 401 com senha incorreta", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: SEED.admin.email, password: "senhaerrada", institutionSlug: SEED.institutionSlug },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 401 com e-mail desconhecido", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email: "naoexiste@test.com", password: "Admin@1234", institutionSlug: SEED.institutionSlug },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 401 sem body (guard dispara antes do ValidationPipe)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {},
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Refresh ──────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/refresh", () => {
    it("retorna novo accessToken com refreshToken válido", async () => {
      const { refreshToken } = await loginAs(app, "coordinator");
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("accessToken");
      expect(body).toHaveProperty("refreshToken");
    });

    it("retorna 401 com refreshToken inválido", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refreshToken: "token-invalido-qualquer" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/logout", () => {
    it("retorna 204 com refreshToken válido", async () => {
      const { refreshToken } = await loginAs(app, "teacher");
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(204);
    });

    it("retorna 401 ao tentar usar refreshToken revogado após logout", async () => {
      const { refreshToken } = await loginAs(app, "student");
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        payload: { refreshToken },
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Reset password ───────────────────────────────────────────────────────

  describe("POST /api/v1/auth/reset-password", () => {
    it("retorna 400 com token inexistente", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/reset-password",
        payload: { token: "token-nao-existe-abc123", password: "NovaSenha@1" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 400 com senha fraca", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/reset-password",
        payload: { token: "qualquer", password: "123" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Forgot password ──────────────────────────────────────────────────────

  describe("POST /api/v1/auth/forgot-password", () => {
    it("retorna 200 mesmo para e-mail inexistente (não revela cadastro)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/forgot-password",
        payload: {
          email: "naoexiste@teste.com",
          institutionSlug: SEED.institutionSlug,
        },
      });
      // Deve retornar 200 mesmo que o e-mail não exista
      expect(res.statusCode).toBe(200);
    });
  });
});
