import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";

export async function createTestApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { logger: false }
  );

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

// Credenciais do seed (senha: Admin@1234)
export const SEED = {
  admin: { email: "admin@escolademo.com", password: "Admin@1234" },
  coordinator: { email: "coord@escolademo.com", password: "Admin@1234" },
  teacher: { email: "professor@escolademo.com", password: "Admin@1234" },
  student: { email: "aluno@escolademo.com", password: "Admin@1234" },
  institutionSlug: "escola-demo",
};

export async function loginAs(
  app: NestFastifyApplication,
  role: keyof typeof SEED
): Promise<{ accessToken: string; refreshToken: string }> {
  const creds = SEED[role] as { email: string; password: string };
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: creds,
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login falhou para ${role}: ${res.statusCode} ${res.body}`);
  }
  return res.json();
}

// Alias semântico para afterAll
export const closeTestApp = (app: NestFastifyApplication) => app.close();
