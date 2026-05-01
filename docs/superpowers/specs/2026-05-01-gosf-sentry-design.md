# GOSF — Integração Sentry (Monitoramento de Erros)

**Data:** 2026-05-01
**Status:** Aprovado
**Escopo:** Frontend (Next.js 15) + Backend (NestJS/Fastify)

---

## 1. Decisões aprovadas

| Decisão | Escolha |
|---|---|
| Provider | sentry.io cloud (free tier — 5k erros/mês) |
| Escopo | Frontend + Backend |
| Projetos Sentry | Dois separados: `gosf-web` (Next.js) e `gosf-api` (Node.js) |
| Alertas | E-mail para primeira ocorrência de cada erro |
| Source maps | Upload automático no build via `@sentry/nextjs` |
| Ambientes | `NODE_ENV` — erros de dev não poluem painel de prod |

---

## 2. Pré-requisito manual

Antes da implementação, o usuário deve:

1. Criar conta gratuita em [sentry.io](https://sentry.io)
2. Criar projeto **Next.js** → copiar o DSN → salvar como `NEXT_PUBLIC_SENTRY_DSN`
3. Criar projeto **Node.js** → copiar o DSN → salvar como `SENTRY_DSN`
4. Gerar Auth Token em *Settings → Auth Tokens* com escopo `project:releases` + `org:read` → salvar como `SENTRY_AUTH_TOKEN`
5. Adicionar as 3 variáveis de ambiente no Easypanel (frontend e backend)

---

## 3. Frontend — `apps/web`

### 3.1 Pacote

```bash
pnpm --filter web add @sentry/nextjs
```

### 3.2 Arquivos a criar

Todos os arquivos de config Sentry ficam na raiz de `apps/web/` (ao lado de `next.config.ts`).
`instrumentation.ts` e `global-error.tsx` ficam dentro de `apps/web/src/`.

| Arquivo | Localização |
|---|---|
| `sentry.client.config.ts` | `apps/web/sentry.client.config.ts` |
| `sentry.server.config.ts` | `apps/web/sentry.server.config.ts` |
| `sentry.edge.config.ts` | `apps/web/sentry.edge.config.ts` |
| `instrumentation.ts` | `apps/web/src/instrumentation.ts` |
| `global-error.tsx` | `apps/web/src/app/global-error.tsx` |

### 3.3 Conteúdo dos arquivos

**`sentry.client.config.ts`**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
});
```

**`sentry.server.config.ts`**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**`sentry.edge.config.ts`**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**`apps/web/src/instrumentation.ts`**
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

> Os imports `"../sentry.*.config"` resolvem de `apps/web/src/` para `apps/web/` — caminho correto.

**`app/global-error.tsx`**
```tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html><body>
      <div style={{ padding: 32, textAlign: "center" }}>
        <h2>Algo deu errado</h2>
        <p>Nossa equipe foi notificada. Tente recarregar a página.</p>
      </div>
    </body></html>
  );
}
```

### 3.4 `next.config.ts`

Envolver a config com `withSentryConfig`:

```ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = { /* config existente */ };

export default withSentryConfig(nextConfig, {
  org: "<slug-da-sua-org-no-sentry>", // ex: "niktronix" — visível na URL: sentry.io/organizations/<slug>
  project: "gosf-web",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

### 3.5 Variáveis de ambiente

```env
# .env.local / Easypanel
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=<slug>
SENTRY_PROJECT=gosf-web
```

---

## 4. Backend — `apps/api`

### 4.1 Pacotes

```bash
pnpm --filter api add @sentry/nestjs @sentry/profiling-node
```

### 4.2 `main.ts`

Init Sentry **antes** de qualquer import do NestJS:

```ts
import "./instrument"; // primeira linha
import { NestFactory } from "@nestjs/core";
// ...
```

**`src/instrument.ts`**
```ts
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});
```

### 4.3 `AppModule`

```ts
import { SentryModule } from "@sentry/nestjs/setup";

@Module({
  imports: [
    SentryModule.forRoot(),
    // demais módulos...
  ],
})
export class AppModule {}
```

### 4.4 Global exception filter

```ts
// src/common/filters/sentry.filter.ts
import { Catch, ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
```

Registrar no `main.ts`:
```ts
const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new SentryFilter(httpAdapter));
```

### 4.5 Variáveis de ambiente

```env
# .env / Easypanel
SENTRY_DSN=https://...@sentry.io/...
```

---

## 5. Fora do escopo

- Performance monitoring aprofundado (apenas `tracesSampleRate: 0.1`)
- Session Replay para usuários comuns (apenas on error)
- Alertas Slack
- Sentry Crons
- Self-hosted Sentry

---

## 6. Critérios de conclusão

- [ ] Pacotes instalados: `@sentry/nextjs`, `@sentry/nestjs`, `@sentry/profiling-node`
- [ ] `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` criados
- [ ] `instrumentation.ts` criado
- [ ] `global-error.tsx` criado
- [ ] `next.config.ts` envolvido com `withSentryConfig`
- [ ] `src/instrument.ts` criado no backend
- [ ] `SentryModule.forRoot()` no `AppModule`
- [ ] `SentryFilter` global registrado no `main.ts`
- [ ] Variáveis de ambiente documentadas (não commitadas)
- [ ] `pnpm lint` e `pnpm typecheck` passando
