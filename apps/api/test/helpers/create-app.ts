import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";

export interface ProviderOverride {
  token: any;
  value: any;
}

// Contador de IP para garantir que cada loginAs use um IP virtual único,
// evitando que o ThrottlerGuard bloqueie chamadas auxiliares nos testes.
let ipCounter = 1;

export async function createTestApp(
  overrides: ProviderOverride[] = [],
): Promise<NestFastifyApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  for (const o of overrides) {
    builder = builder.overrideProvider(o.token).useValue(o.value);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false, trustProxy: true }),
    { logger: false, rawBody: true },
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
  // Usa um IP virtual único por chamada para não esgotar a cota do ThrottlerGuard
  const fakeIp = `10.0.${Math.floor(ipCounter / 256)}.${ipCounter++ % 256}`;
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    headers: { "x-forwarded-for": fakeIp },
    payload: { ...creds, institutionSlug: SEED.institutionSlug },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login falhou para ${role}: ${res.statusCode} ${res.body}`);
  }
  return res.json();
}

// Alias semântico para afterAll
export const closeTestApp = (app: NestFastifyApplication) => app.close();
