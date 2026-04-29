# Plan Guard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear acesso à plataforma (HTTP 402) para institutions com `status=SUSPENDED` ou `status=INACTIVE`, usando JWT global + PlanGuard global, com isenções para rotas públicas e endpoints de billing.

**Architecture:** `JwtAuthGuard` vira global (APP_GUARD) com suporte a `@Public()`. `PlanGuard` é o segundo APP_GUARD e lê `request.user.institutionStatus` (populado pelo JwtStrategy). Controllers removem `@UseGuards(JwtAuthGuard)` — JWT agora é garantido globalmente.

**Tech Stack:** NestJS Fastify, Passport JWT, Prisma, Jest e2e, Next.js 15.

---

## Mapa de Arquivos

### Criar
- `apps/api/src/common/decorators/public.decorator.ts` — decorator `@Public()`
- `apps/api/src/common/decorators/skip-plan-guard.decorator.ts` — decorator `@SkipPlanGuard()`
- `apps/api/src/common/guards/plan.guard.ts` — guard que bloqueia institutions suspensas
- `apps/api/test/plan-guard.e2e-spec.ts` — testes e2e do guard

### Modificar
- `apps/api/src/common/guards/jwt-auth.guard.ts` — suporte a `@Public()` + injeção de `Reflector`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` — adiciona `institutionStatus` ao user object
- `apps/api/src/app.module.ts` — registra `JwtAuthGuard` e `PlanGuard` como `APP_GUARD`
- `apps/api/src/modules/auth/auth.controller.ts` — adiciona `@Public()` na classe
- `apps/api/src/modules/health/health.controller.ts` — adiciona `@Public()` na classe
- `apps/api/src/modules/billing/webhooks.controller.ts` — adiciona `@Public()` na classe
- `apps/api/src/modules/institutions/institutions.controller.ts` — `@Public()` em `register`, remove `JwtAuthGuard` dos métodos protegidos
- `apps/api/src/modules/billing/billing.controller.ts` — remove `@UseGuards(JwtAuthGuard)` da classe, adiciona `@SkipPlanGuard()` em `getStatus` e `createPortal`
- `apps/api/src/modules/notifications/notifications.controller.ts` — remove `@UseGuards(JwtAuthGuard)` da classe
- `apps/api/src/modules/ai/ai.controller.ts` — `@UseGuards(JwtAuthGuard, RolesGuard)` → `@UseGuards(RolesGuard)`
- `apps/api/src/modules/analytics/analytics.controller.ts` — idem
- `apps/api/src/modules/audit/audit.controller.ts` — idem
- `apps/api/src/modules/classes/classes.controller.ts` — idem (2 controllers no mesmo arquivo)
- `apps/api/src/modules/evaluations/evaluations.controller.ts` — idem
- `apps/api/src/modules/goals/goals.controller.ts` — idem
- `apps/api/src/modules/privacy/privacy.controller.ts` — idem
- `apps/api/src/modules/users/users.controller.ts` — idem
- `apps/web/src/lib/api/client.ts` — intercepta HTTP 402 e redireciona/alerta por role

---

## Task 1: Decorators @Public() e @SkipPlanGuard()

**Files:**
- Create: `apps/api/src/common/decorators/public.decorator.ts`
- Create: `apps/api/src/common/decorators/skip-plan-guard.decorator.ts`

- [ ] **Step 1: Criar public.decorator.ts**

Criar `apps/api/src/common/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Criar skip-plan-guard.decorator.ts**

Criar `apps/api/src/common/decorators/skip-plan-guard.decorator.ts`:

```typescript
import { SetMetadata } from "@nestjs/common";

export const SKIP_PLAN_GUARD_KEY = "skipPlanGuard";
export const SkipPlanGuard = () => SetMetadata(SKIP_PLAN_GUARD_KEY, true);
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/common/decorators/public.decorator.ts apps/api/src/common/decorators/skip-plan-guard.decorator.ts
git commit -m "feat(api): adiciona decorators @Public() e @SkipPlanGuard()"
```

---

## Task 2: JwtAuthGuard — suporte a @Public() e registro futuro como global

**Files:**
- Modify: `apps/api/src/common/guards/jwt-auth.guard.ts`

- [ ] **Step 1: Refatorar JwtAuthGuard**

Substituir o conteúdo de `apps/api/src/common/guards/jwt-auth.guard.ts`:

```typescript
import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/common/guards/jwt-auth.guard.ts
git commit -m "feat(api): JwtAuthGuard suporta @Public() via Reflector"
```

---

## Task 3: JwtStrategy — adiciona institutionStatus ao user object

**Files:**
- Modify: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`

- [ ] **Step 1: Adicionar include de institution no validate()**

Substituir o conteúdo de `apps/api/src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../../../common/database/database.service";
import { JwtPayload } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        institutionId: true,
        institution: { select: { status: true } },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institutionId: user.institutionId,
      institutionStatus: user.institution.status,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/auth/strategies/jwt.strategy.ts
git commit -m "feat(api): JwtStrategy retorna institutionStatus no user object"
```

---

## Task 4: PlanGuard

**Files:**
- Create: `apps/api/src/common/guards/plan.guard.ts`

- [ ] **Step 1: Criar plan.guard.ts**

Criar `apps/api/src/common/guards/plan.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_PLAN_GUARD_KEY } from "../decorators/skip-plan-guard.decorator";

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true;

    if (user.role === "ADMIN") return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PLAN_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    if (user.institutionStatus === "SUSPENDED") {
      throw new HttpException(
        "Sua assinatura está suspensa por falha no pagamento. Acesse as configurações para regularizar.",
        402,
      );
    }

    if (user.institutionStatus === "INACTIVE") {
      throw new HttpException(
        "Assinatura cancelada. Acesse /coordinator/settings para reativar.",
        402,
      );
    }

    return true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/common/guards/plan.guard.ts
git commit -m "feat(api): cria PlanGuard que bloqueia institutions SUSPENDED/INACTIVE com 402"
```

---

## Task 5: AppModule — registrar guards globais

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Adicionar JwtAuthGuard e PlanGuard como APP_GUARD**

Em `apps/api/src/app.module.ts`, adicionar os imports:

```typescript
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PlanGuard } from "./common/guards/plan.guard";
```

E atualizar o array `providers`:

```typescript
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PlanGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat(api): registra JwtAuthGuard e PlanGuard como guards globais"
```

---

## Task 6: Marcar rotas públicas com @Public()

**Files:**
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/health/health.controller.ts`
- Modify: `apps/api/src/modules/billing/webhooks.controller.ts`
- Modify: `apps/api/src/modules/institutions/institutions.controller.ts`

- [ ] **Step 1: AuthController — @Public() na classe**

Em `apps/api/src/modules/auth/auth.controller.ts`, adicionar o import e o decorator na classe:

```typescript
import { Public } from "../../common/decorators/public.decorator";
```

E na classe:

```typescript
@Public()
@Controller("auth")
export class AuthController {
```

O `@UseGuards(AuthGuard("local"))` no método `login` permanece intacto — o decorator `@Public()` só desativa o `JwtAuthGuard` global, não outros guards definidos no método.

- [ ] **Step 2: HealthController — @Public() na classe**

Em `apps/api/src/modules/health/health.controller.ts`:

```typescript
import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";

@Public()
@SkipThrottle({ default: true, auth: true })
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

- [ ] **Step 3: WebhooksController — @Public() na classe**

Em `apps/api/src/modules/billing/webhooks.controller.ts`, adicionar import e decorator:

```typescript
import { BadRequestException, Controller, Headers, Post, Req } from "@nestjs/common";
import { RawBodyRequest } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { BillingService } from "./billing.service";

@Public()
@Controller("webhooks")
@SkipThrottle({ default: true, auth: true })
export class WebhooksController {
  constructor(private billing: BillingService) {}

  @Post("stripe")
  async handleStripe(
    @Req() req: RawBodyRequest<any>,
    @Headers("stripe-signature") sig: string,
  ) {
    if (!sig) throw new BadRequestException("stripe-signature ausente.");
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException("rawBody não disponível.");
    return this.billing.handleWebhookEvent(rawBody, sig);
  }
}
```

- [ ] **Step 4: InstitutionsController — @Public() em register, remover JwtAuthGuard dos métodos**

Substituir o conteúdo de `apps/api/src/modules/institutions/institutions.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "@gosf/database";
import { InstitutionsService } from "./institutions.service";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { RegisterInstitutionDto } from "./dto/register-institution.dto";

@Controller("institutions")
export class InstitutionsController {
  constructor(private institutions: InstitutionsService) {}

  @Public()
  @Post("register")
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterInstitutionDto) {
    return this.institutions.register(dto);
  }

  @Get("me")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getMyInstitution(@CurrentUser() user: any) {
    return this.institutions.findById(user.institutionId);
  }

  @Patch("me")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  updateMyInstitution(@CurrentUser() user: any, @Body() dto: UpdateInstitutionDto) {
    return this.institutions.update(user.institutionId, dto);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/health/health.controller.ts apps/api/src/modules/billing/webhooks.controller.ts apps/api/src/modules/institutions/institutions.controller.ts
git commit -m "feat(api): adiciona @Public() nas rotas públicas (auth, health, webhooks, register)"
```

---

## Task 7: Remover JwtAuthGuard dos controllers protegidos

**Files:**
- Modify: `apps/api/src/modules/billing/billing.controller.ts`
- Modify: `apps/api/src/modules/notifications/notifications.controller.ts`
- Modify: `apps/api/src/modules/ai/ai.controller.ts`
- Modify: `apps/api/src/modules/analytics/analytics.controller.ts`
- Modify: `apps/api/src/modules/audit/audit.controller.ts`
- Modify: `apps/api/src/modules/classes/classes.controller.ts`
- Modify: `apps/api/src/modules/evaluations/evaluations.controller.ts`
- Modify: `apps/api/src/modules/goals/goals.controller.ts`
- Modify: `apps/api/src/modules/privacy/privacy.controller.ts`
- Modify: `apps/api/src/modules/users/users.controller.ts`

Em cada arquivo abaixo, remover o import de `JwtAuthGuard` e trocar `@UseGuards(JwtAuthGuard, RolesGuard)` por `@UseGuards(RolesGuard)`, ou apenas remover `@UseGuards(JwtAuthGuard)` onde `RolesGuard` não estava presente. JWT agora é global.

- [ ] **Step 1: billing.controller.ts — remover @UseGuards(JwtAuthGuard) da classe + adicionar @SkipPlanGuard()**

Substituir o conteúdo de `apps/api/src/modules/billing/billing.controller.ts`:

```typescript
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SkipPlanGuard } from "../../common/decorators/skip-plan-guard.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { BillingService } from "./billing.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get("status")
  @SkipPlanGuard()
  getStatus(@CurrentUser() user: any) {
    return this.billing.getStatus(user.institutionId);
  }

  @Post("checkout")
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createCheckout(@CurrentUser() user: any, @Body() dto: CreateCheckoutDto) {
    return this.billing.createCheckoutSession(user.institutionId, dto);
  }

  @Post("portal")
  @SkipPlanGuard()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createPortal(@CurrentUser() user: any) {
    return this.billing.createPortalSession(user.institutionId);
  }
}
```

- [ ] **Step 2: notifications.controller.ts — remover @UseGuards(JwtAuthGuard)**

Em `apps/api/src/modules/notifications/notifications.controller.ts`, remover o import de `JwtAuthGuard` e o decorator `@UseGuards(JwtAuthGuard)` da classe. Manter o resto intacto.

- [ ] **Step 3: ai, analytics, audit, classes, evaluations, goals, privacy, users — trocar @UseGuards(JwtAuthGuard, RolesGuard) por @UseGuards(RolesGuard)**

Para cada um dos seguintes arquivos, remover o import de `JwtAuthGuard` e substituir `@UseGuards(JwtAuthGuard, RolesGuard)` por `@UseGuards(RolesGuard)`:

- `apps/api/src/modules/ai/ai.controller.ts` — linha ~10
- `apps/api/src/modules/analytics/analytics.controller.ts` — linha ~10
- `apps/api/src/modules/audit/audit.controller.ts` — linha ~10
- `apps/api/src/modules/classes/classes.controller.ts` — linhas ~23 e ~105 (dois controllers no mesmo arquivo: `ClassesController` e `SubjectsController`)
- `apps/api/src/modules/evaluations/evaluations.controller.ts` — linha ~28
- `apps/api/src/modules/goals/goals.controller.ts` — linha ~14
- `apps/api/src/modules/privacy/privacy.controller.ts` — linha ~24
- `apps/api/src/modules/users/users.controller.ts` — linha ~26

Em cada arquivo:
1. Remover: `import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";`
2. Substituir: `@UseGuards(JwtAuthGuard, RolesGuard)` → `@UseGuards(RolesGuard)`

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/
git commit -m "refactor(api): remove JwtAuthGuard dos controllers (JWT agora é global)"
```

---

## Task 8: Frontend — interceptar 402 no client.ts

**Files:**
- Modify: `apps/web/src/lib/api/client.ts`

- [ ] **Step 1: Adicionar interceptação de 402**

Em `apps/web/src/lib/api/client.ts`, adicionar uma flag de controle e o tratamento do 402.

Substituir o conteúdo do arquivo:

```typescript
import { getValidAccessToken } from "@/lib/auth/session";

const API_URL = "/api/v1";

let handling402 = false;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handle402() {
  if (handling402) return;
  handling402 = true;

  try {
    const { useAuthStore } = await import("@/store/auth.store");
    const role = useAuthStore.getState().user?.role;

    if (role === "COORDINATOR" || role === "ADMIN") {
      window.location.href = "/coordinator/settings?tab=assinatura";
    } else {
      alert("A assinatura da sua escola está suspensa. Contate o coordenador.");
      handling402 = false;
    }
  } catch {
    window.location.href = "/coordinator/settings?tab=assinatura";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getValidAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    if (res.status === 402) {
      handle402();
      throw new ApiError(402, "Assinatura suspensa ou cancelada.");
    }
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(res.status, error.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, skipAuth = false) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth,
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api/client.ts
git commit -m "feat(web): intercepta HTTP 402 no client e redireciona por role"
```

---

## Task 9: Testes e2e — plan-guard.e2e-spec.ts

**Files:**
- Create: `apps/api/test/plan-guard.e2e-spec.ts`

- [ ] **Step 1: Criar os testes e2e**

Criar `apps/api/test/plan-guard.e2e-spec.ts`:

```typescript
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";
import { DatabaseService } from "../src/common/database/database.service";

describe("PlanGuard (e2e)", () => {
  let app: NestFastifyApplication;
  let db: DatabaseService;
  let coordinatorToken: string;
  let studentToken: string;
  let adminToken: string;
  let institutionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(DatabaseService);

    const institution = await db.institution.findUnique({
      where: { slug: "escola-demo" },
      select: { id: true },
    });
    if (!institution) throw new Error("Seed institution not found");
    institutionId = institution.id;

    [coordinatorToken, studentToken, adminToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "admin").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await db.institution.update({
      where: { id: institutionId },
      data: { status: "TRIAL" },
    });
    await closeTestApp(app);
  });

  async function setStatus(status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "INACTIVE") {
    await db.institution.update({ where: { id: institutionId }, data: { status } });
  }

  // ─── TRIAL e ACTIVE têm acesso normal ─────────────────────────────────────

  describe("institution TRIAL", () => {
    beforeAll(() => setStatus("TRIAL"));

    it("coordinator acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("student acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("institution ACTIVE", () => {
    beforeAll(() => setStatus("ACTIVE"));

    it("coordinator acessa rota protegida (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── SUSPENDED bloqueia rotas de negócio ──────────────────────────────────

  describe("institution SUSPENDED", () => {
    beforeAll(() => setStatus("SUSPENDED"));

    it("coordinator recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(402);
    });

    it("student recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(402);
    });

    it("GET /billing/status retorna 200 (@SkipPlanGuard)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("POST /billing/portal retorna 400 (sem customer, mas não 402)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/billing/portal",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(400);
    });

    it("ADMIN tem acesso mesmo com SUSPENDED (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("rota pública /auth/login retorna 200 independente do status", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "coord@escolademo.com",
          password: "Admin@1234",
          institutionSlug: "escola-demo",
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it("rota sem autenticação retorna 401 (não 402)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── INACTIVE bloqueia rotas de negócio ───────────────────────────────────

  describe("institution INACTIVE", () => {
    beforeAll(() => setStatus("INACTIVE"));

    it("coordinator recebe 402 em rota de negócio", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(402);
    });

    it("GET /billing/status retorna 200 (@SkipPlanGuard)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/billing/status",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
```

- [ ] **Step 2: Rodar os testes**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api test:e2e -- --testPathPattern plan-guard
```

Expected: todos os testes passam.

- [ ] **Step 3: Commit**

```bash
git add apps/api/test/plan-guard.e2e-spec.ts
git commit -m "test(e2e): adiciona testes do PlanGuard para institutions SUSPENDED/INACTIVE"
```

---

## Task 10: Push final

- [ ] **Step 1: Verificar que todos os commits foram feitos**

```bash
git log --oneline -15
```

- [ ] **Step 2: Push para main**

```bash
git push origin main
```

Expected: push aceito sem conflitos.
