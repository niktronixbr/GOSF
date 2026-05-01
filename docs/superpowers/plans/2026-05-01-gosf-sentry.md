# Sentry — Monitoramento de Erros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar Sentry no frontend (Next.js 15) e backend (NestJS/Fastify) para capturar erros em produção com alertas por e-mail.

**Architecture:** Frontend usa `@sentry/nextjs` com três configs de runtime (client/server/edge) carregadas via `instrumentation.ts` do Next.js 15. Backend usa `@sentry/nestjs` com `instrument.ts` importado antes de qualquer módulo NestJS e `SentryGlobalFilter` registrado como filtro global via `APP_FILTER`.

**Tech Stack:** `@sentry/nextjs`, `@sentry/nestjs`, `@sentry/profiling-node`, Next.js 15 App Router, NestJS Fastify

**Pré-requisito:** Antes de executar este plano, o usuário deve:
1. Criar conta em sentry.io
2. Criar projeto **Next.js** → copiar DSN
3. Criar projeto **Node.js** → copiar DSN
4. Gerar Auth Token em *Settings → Auth Tokens* (escopos: `project:releases`, `org:read`)
5. Ter em mãos: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, slug da org Sentry

---

## Mapa de arquivos

**Frontend (`apps/web/`)**
- Criar: `sentry.client.config.ts` — init Sentry no browser
- Criar: `sentry.server.config.ts` — init Sentry no Node SSR
- Criar: `sentry.edge.config.ts` — init Sentry no Edge runtime
- Criar: `src/instrumentation.ts` — hook Next.js 15 que carrega os configs acima
- Criar: `src/app/global-error.tsx` — captura erros não tratados no layout raiz
- Modificar: `next.config.ts` — envolver com `withSentryConfig`

**Backend (`apps/api/`)**
- Criar: `src/instrument.ts` — init Sentry antes do NestJS bootstrap
- Criar: `src/common/filters/sentry.filter.ts` — filtro global de exceções
- Modificar: `src/main.ts` — importar `./instrument` na primeira linha, registrar `SentryGlobalFilter`
- Modificar: `src/app.module.ts` — adicionar `SentryModule.forRoot()` nos imports

---

## Task 1: Instalar pacotes

**Files:**
- Modify: `apps/web/package.json` (via pnpm)
- Modify: `apps/api/package.json` (via pnpm)

- [ ] **Instalar `@sentry/nextjs` no frontend**

```bash
cd C:/Users/LENOVO/NikProjects/GOSF
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web add @sentry/nextjs
```

Saída esperada: `Done in ...`

- [ ] **Instalar pacotes Sentry no backend**

```bash
pnpm --filter api add @sentry/nestjs @sentry/profiling-node
```

Saída esperada: `Done in ...`

- [ ] **Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/api/package.json pnpm-lock.yaml
git commit -m "chore: instalar @sentry/nextjs e @sentry/nestjs"
```

---

## Task 2: Configurar frontend — arquivos de init Sentry

**Files:**
- Criar: `apps/web/sentry.client.config.ts`
- Criar: `apps/web/sentry.server.config.ts`
- Criar: `apps/web/sentry.edge.config.ts`
- Criar: `apps/web/src/instrumentation.ts`

- [ ] **Criar `apps/web/sentry.client.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
});
```

- [ ] **Criar `apps/web/sentry.server.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

- [ ] **Criar `apps/web/sentry.edge.config.ts`**

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

- [ ] **Criar `apps/web/src/instrumentation.ts`**

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
```

> Os imports `"../sentry.*.config"` resolvem de `apps/web/src/` para `apps/web/` — correto.

- [ ] **Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Saída esperada: sem erros.

- [ ] **Commit**

```bash
git add apps/web/sentry.client.config.ts apps/web/sentry.server.config.ts apps/web/sentry.edge.config.ts apps/web/src/instrumentation.ts
git commit -m "feat(web): adicionar configs Sentry client/server/edge + instrumentation"
```

---

## Task 3: Configurar frontend — global-error e next.config.ts

**Files:**
- Criar: `apps/web/src/app/global-error.tsx`
- Modificar: `apps/web/next.config.ts`

- [ ] **Criar `apps/web/src/app/global-error.tsx`**

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Algo deu errado</h2>
        <p style={{ color: "#78716c", marginTop: "0.5rem" }}>
          Nossa equipe foi notificada. Tente recarregar a página.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
```

- [ ] **Atualizar `apps/web/next.config.ts`**

Substituir o conteúdo completo por:

```ts
import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "gosf-web",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

- [ ] **Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Saída esperada: sem erros.

- [ ] **Commit**

```bash
git add apps/web/src/app/global-error.tsx apps/web/next.config.ts
git commit -m "feat(web): global-error boundary + withSentryConfig no next.config"
```

---

## Task 4: Configurar backend — instrument.ts e main.ts

**Files:**
- Criar: `apps/api/src/instrument.ts`
- Modificar: `apps/api/src/main.ts`

- [ ] **Criar `apps/api/src/instrument.ts`**

```ts
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});
```

- [ ] **Atualizar `apps/api/src/main.ts`** — adicionar import de `./instrument` como PRIMEIRA linha

```ts
import "./instrument";
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true, rawBody: true }
  );

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryGlobalFilter(httpAdapter));

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

- [ ] **Verificar typecheck do backend**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api typecheck 2>&1 | tail -20
```

Saída esperada: sem erros (ou apenas warnings pré-existentes).

- [ ] **Commit**

```bash
git add apps/api/src/instrument.ts apps/api/src/main.ts
git commit -m "feat(api): init Sentry via instrument.ts + SentryGlobalFilter no main"
```

---

## Task 5: Configurar backend — SentryModule no AppModule

**Files:**
- Modificar: `apps/api/src/app.module.ts`

- [ ] **Atualizar `apps/api/src/app.module.ts`** — adicionar `SentryModule.forRoot()` como primeiro import

```ts
import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { SentryModule } from "@sentry/nestjs/setup";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PlanGuard } from "./common/guards/plan.guard";
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
import { BillingModule } from "./modules/billing/billing.module";
import { AdminModule } from "./modules/admin/admin.module";
import { DatabaseModule } from "./common/database/database.module";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.currentPassword",
          "req.body.newPassword",
          "req.body.token",
          "req.body.refreshToken",
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
    BillingModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PlanGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
```

- [ ] **Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api typecheck 2>&1 | tail -20
```

Saída esperada: sem erros.

- [ ] **Commit**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat(api): adicionar SentryModule.forRoot() no AppModule"
```

---

## Task 6: Variáveis de ambiente e verificação final

**Files:**
- Verificar: `.env.example` ou README com documentação das vars

- [ ] **Documentar variáveis necessárias** — adicionar ao `.env` local (NÃO commitar valores reais)

```bash
# Verificar se há .env.example no projeto
ls apps/web/.env.example apps/api/.env.example 2>/dev/null || echo "não existe"
```

Se não existir, criar `apps/web/.env.local.example`:
```env
# Sentry — Frontend
NEXT_PUBLIC_SENTRY_DSN=https://<chave>@o<org>.ingest.sentry.io/<project-id>
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=<slug-da-org>
SENTRY_PROJECT=gosf-web
```

E `apps/api/.env.example` (adicionar ao existente):
```env
# Sentry — Backend
SENTRY_DSN=https://<chave>@o<org>.ingest.sentry.io/<project-id>
```

- [ ] **Rodar lint em todo o projeto**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web lint 2>&1 | grep -E "error|Error" | head -20
pnpm --filter api lint 2>&1 | grep -E "error|Error" | head -20
```

Saída esperada: 0 erros.

- [ ] **Rodar typecheck em todo o projeto**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
pnpm --filter api typecheck 2>&1 | tail -10
```

Saída esperada: sem erros.

- [ ] **Commit final**

```bash
git add apps/web/.env.local.example apps/api/.env.example 2>/dev/null
git commit -m "chore: documentar variáveis de ambiente Sentry" --allow-empty
git push origin main
```

---

## Configuração no Easypanel (pós-implementação)

Após o push, adicionar as variáveis no painel do Easypanel para os serviços `gosf-web` e `gosf-api`:

| Serviço | Variável | Valor |
|---|---|---|
| gosf-web | `NEXT_PUBLIC_SENTRY_DSN` | DSN do projeto Next.js no Sentry |
| gosf-web | `SENTRY_AUTH_TOKEN` | Token gerado no Sentry |
| gosf-web | `SENTRY_ORG` | Slug da org no Sentry |
| gosf-web | `SENTRY_PROJECT` | `gosf-web` |
| gosf-api | `SENTRY_DSN` | DSN do projeto Node.js no Sentry |
