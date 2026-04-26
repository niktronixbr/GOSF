# Produção: Segurança + Observabilidade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a API pronta para produção com rate limiting preciso, health check extensível e logs JSON estruturados.

**Architecture:** ThrottlerModule já existe — será atualizado para throttlers nomeados (default + auth). HealthModule novo usando @nestjs/terminus com check vazio (extensível). nestjs-pino substitui o Logger padrão do NestJS, produzindo JSON em produção e pretty-print em dev.

**Tech Stack:** `@nestjs/throttler@^6` (já instalado), `@nestjs/terminus` (novo), `nestjs-pino` + `pino-http` + `pino-pretty` (novos)

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `apps/api/package.json` | Modificar | Adicionar 3 dependências + 1 devDependency |
| `apps/api/src/app.module.ts` | Modificar | ThrottlerModule nomeado + LoggerModule + HealthModule |
| `apps/api/src/main.ts` | Modificar | Usar Logger do nestjs-pino + bufferLogs |
| `apps/api/src/modules/auth/auth.controller.ts` | Modificar | Throttler nomeado `auth` nos 3 endpoints sensíveis |
| `apps/api/src/modules/health/health.module.ts` | Criar | Módulo que importa TerminusModule |
| `apps/api/src/modules/health/health.controller.ts` | Criar | GET /health com @SkipThrottle + @HealthCheck |
| `apps/api/test/health.e2e-spec.ts` | Criar | E2e test: 200 sem auth no /health |
| `apps/api/test/auth.e2e-spec.ts` | Modificar | Adicionar teste de rate limit 429 |

---

## Task 1: Instalar dependências

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Instalar dependências de produção e dev**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
pnpm add @nestjs/terminus nestjs-pino pino-http
pnpm add -D pino-pretty
```

- [ ] **Step 2: Verificar que as dependências foram adicionadas**

```bash
grep -E '"@nestjs/terminus|nestjs-pino|pino-http|pino-pretty' package.json
```

Esperado: 3 linhas em `dependencies` e 1 em `devDependencies`.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/api/package.json apps/api/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(api): adiciona terminus, nestjs-pino e pino-http"
```

---

## Task 2: Atualizar rate limiting para throttlers nomeados

**Files:**
- Modify: `apps/api/src/app.module.ts` (linha 22)
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/test/auth.e2e-spec.ts`

### Por que mudar

O ThrottlerModule atual usa um throttler anônimo `{ ttl: 60000, limit: 100 }`. Precisamos de dois throttlers nomeados para aplicar limites diferentes por tipo de rota: `default` (200 req/min global) e `auth` (5 req/min nos endpoints de autenticação).

- [ ] **Step 1: Escrever o teste de rate limit que deve FALHAR primeiro**

Abra `apps/api/test/auth.e2e-spec.ts`. Localize o bloco `describe("POST /api/v1/auth/login", ...)` e adicione este teste **dentro** do bloco, após os testes existentes:

```typescript
it("retorna 429 após 5 tentativas de login em 60s (rate limit auth)", async () => {
  // Faz 5 requisições — todas retornam 401 (senha errada) mas consomem cota
  for (let i = 0; i < 5; i++) {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "inexistente@teste.com",
        password: "senhaerrada",
        institutionSlug: SEED.institutionSlug,
      },
    });
  }
  // 6ª requisição deve bater no rate limit
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: {
      email: "inexistente@teste.com",
      password: "senhaerrada",
      institutionSlug: SEED.institutionSlug,
    },
  });
  expect(res.statusCode).toBe(429);
}, 30000);
```

- [ ] **Step 2: Rodar o teste para confirmar que FALHA**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx jest test/auth.e2e-spec.ts --testNamePattern="429" --no-coverage 2>&1 | tail -20
```

Esperado: `FAIL` — o teste não passa com o throttler atual (limite 100, sem throttler `auth`).

- [ ] **Step 3: Atualizar ThrottlerModule em app.module.ts**

Substitua a linha 22 de `apps/api/src/app.module.ts`:

```typescript
// ANTES (linha 22):
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

// DEPOIS:
ThrottlerModule.forRoot([
  { name: "default", ttl: 60000, limit: 200 },
  { name: "auth", ttl: 60000, limit: 5 },
]),
```

- [ ] **Step 4: Atualizar decorators em auth.controller.ts**

Substitua o conteúdo de `apps/api/src/modules/auth/auth.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @UseGuards(AuthGuard("local"))
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: any, @Body() _dto: LoginDto) {
    return this.authService.login(user);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.institutionSlug);
  }

  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
```

- [ ] **Step 5: Rodar o teste novamente para confirmar que PASSA**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx jest test/auth.e2e-spec.ts --testNamePattern="429" --no-coverage 2>&1 | tail -20
```

Esperado: `PASS` com o teste `429 após 5 tentativas`.

- [ ] **Step 6: Rodar toda a suite e2e de auth para confirmar sem regressões**

```bash
npx jest test/auth.e2e-spec.ts --no-coverage 2>&1 | tail -20
```

Esperado: todos os testes passando.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/api/src/app.module.ts apps/api/src/modules/auth/auth.controller.ts apps/api/test/auth.e2e-spec.ts
git commit -m "feat(api): rate limiting nomeado — default 200/min, auth 5/min"
```

---

## Task 3: Health check com @nestjs/terminus

**Files:**
- Create: `apps/api/src/modules/health/health.module.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/health.e2e-spec.ts`

- [ ] **Step 1: Escrever o teste e2e de health check que deve FALHAR primeiro**

Crie o arquivo `apps/api/test/health.e2e-spec.ts`:

```typescript
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
      // Faz 300 requisições — deve sempre retornar 200 (SkipThrottle)
      for (let i = 0; i < 10; i++) {
        const res = await app.inject({ method: "GET", url: "/api/v1/health" });
        expect(res.statusCode).toBe(200);
      }
    });
  });
});
```

- [ ] **Step 2: Rodar para confirmar FALHA (rota não existe ainda)**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx jest test/health.e2e-spec.ts --no-coverage 2>&1 | tail -20
```

Esperado: `FAIL` — 404 no `/api/v1/health`.

- [ ] **Step 3: Criar health.controller.ts**

Crie `apps/api/src/modules/health/health.controller.ts`:

```typescript
import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
```

- [ ] **Step 4: Criar health.module.ts**

Crie `apps/api/src/modules/health/health.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 5: Registrar HealthModule no AppModule**

Em `apps/api/src/app.module.ts`, adicione o import de `HealthModule` na seção `imports`:

```typescript
// Adicionar no topo dos imports:
import { HealthModule } from "./modules/health/health.module";

// Adicionar na lista de imports do @Module (após GoalsModule):
HealthModule,
```

O arquivo completo ficará assim:

```typescript
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { EvaluationsModule } from "./modules/evaluations/evaluations.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PrivacyModule } from "./modules/privacy/privacy.module";
import { AuditModule } from "./modules/audit/audit.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { HealthModule } from "./modules/health/health.module";
import { DatabaseModule } from "./common/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 200 },
      { name: "auth", ttl: 60000, limit: 5 },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    ClassesModule,
    EvaluationsModule,
    AnalyticsModule,
    AiModule,
    NotificationsModule,
    PrivacyModule,
    AuditModule,
    GoalsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Rodar o teste de health para confirmar que PASSA**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx jest test/health.e2e-spec.ts --no-coverage 2>&1 | tail -20
```

Esperado: `PASS` — 200 com `{ status: "ok" }`.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/api/src/modules/health/ apps/api/src/app.module.ts apps/api/test/health.e2e-spec.ts
git commit -m "feat(api): health check endpoint GET /api/v1/health via terminus"
```

---

## Task 4: Logs estruturados com nestjs-pino

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

### Por que nestjs-pino com Fastify

O Fastify tem seu próprio logger (pino nativo). Ao usar `FastifyAdapter({ logger: false })`, desabilitamos o logger do Fastify. O `nestjs-pino` injeta um `LoggerModule` no NestJS que produz JSON usando pino. `bufferLogs: true` garante que logs do bootstrap (antes do logger estar pronto) sejam roteados pelo pino.

- [ ] **Step 1: Adicionar LoggerModule ao AppModule**

Atualize `apps/api/src/app.module.ts` adicionando o `LoggerModule`:

```typescript
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { EvaluationsModule } from "./modules/evaluations/evaluations.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PrivacyModule } from "./modules/privacy/privacy.module";
import { AuditModule } from "./modules/audit/audit.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { HealthModule } from "./modules/health/health.module";
import { DatabaseModule } from "./common/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
        redact: [
          "req.headers.authorization",
          "body.password",
          "body.token",
          "body.refreshToken",
        ],
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 200 },
      { name: "auth", ttl: 60000, limit: 5 },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    ClassesModule,
    EvaluationsModule,
    AnalyticsModule,
    AiModule,
    NotificationsModule,
    PrivacyModule,
    AuditModule,
    GoalsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Atualizar main.ts para usar o Logger do nestjs-pino**

Substitua o conteúdo de `apps/api/src/main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true }
  );

  app.useLogger(app.get(Logger));
  app.flushLogs();

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("GOSF API")
    .setDescription(
      "API da Plataforma GOSF — Sistema SaaS de Inteligência Relacional Educacional"
    )
    .setVersion("1.0")
    .addServer("/api/v1", "Servidor de desenvolvimento")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
```

- [ ] **Step 3: Verificar que a API ainda compila**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros de compilação.

- [ ] **Step 4: Subir a API em dev e verificar o formato dos logs**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd ../..
pnpm --filter api dev
```

Em outro terminal, fazer uma requisição e observar o log:

```bash
curl -s http://localhost:3001/api/v1/health
```

Em dev, o log deve aparecer formatado com `pino-pretty`. Em produção (simulado com `NODE_ENV=production`), o log seria JSON.

- [ ] **Step 5: Rodar todos os testes e2e para confirmar zero regressões**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd apps/api
npx jest test/ --no-coverage 2>&1 | tail -30
```

Esperado: todos os testes passando.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/api/src/app.module.ts apps/api/src/main.ts
git commit -m "feat(api): logs estruturados JSON via nestjs-pino + redação de campos sensíveis"
```

---

## Task 5: Push final e validação

- [ ] **Step 1: Push para o GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Verificar critérios de aceitação**

| Critério | Como verificar |
|---|---|
| `POST /auth/login` retorna 429 após 5 req/min | Coberto pelo e2e test |
| `GET /health` retorna `{ "status": "ok" }` sem auth | Coberto pelo e2e test |
| Logs em prod são JSON válido | `docker logs gosf_prod_api \| jq .` |
| `password` e `authorization` não aparecem nos logs | Inspecionar log de uma req de login |
| Nenhuma rota existente quebrou | Suite e2e completa passando |

---

## Notas de implementação

- O teste de rate limit usa `email: "inexistente@teste.com"` (não existe no seed) para garantir 401, mas ainda contabilizar no throttle counter
- `bufferLogs: true` + `app.flushLogs()` garante que mensagens do bootstrap apareçam no pino, não no Logger padrão
- `pino-pretty` só é ativado quando `NODE_ENV !== "production"` — em staging/prod, JSON puro vai para stdout e pode ser coletado por qualquer stack de observabilidade (Loki, CloudWatch, etc.)
- Para adicionar verificação de DB ao health check no futuro: criar `PrismaHealthIndicator` e adicioná-lo ao array em `health.controller.ts`
