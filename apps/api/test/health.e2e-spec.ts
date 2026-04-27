import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp } from "./helpers/create-app";

describe("Health (e2e)", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe("GET /api/v1/health", () => {
    it("retorna 200 com status ok sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/health",
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
    });

    it("não é bloqueado pelo rate limiter", async () => {
      // Faz 10 requisições — deve sempre retornar 200 (SkipThrottle)
      for (let i = 0; i < 10; i++) {
        const res = await app.inject({ method: "GET", url: "/api/v1/health" });
        expect(res.statusCode).toBe(200);
      }
    });
  });
});
