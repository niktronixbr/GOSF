# Plan Guard — Implementation Spec

**Goal:** Bloquear acesso à plataforma para institutions com `status=SUSPENDED` ou `status=INACTIVE`, retornando HTTP 402. ADMIN sempre tem acesso. Rotas públicas e endpoints de billing são isentos para permitir que o coordinator regularize a assinatura.

**Date:** 2026-04-29

---

## Arquitetura

Dois guards globais registrados em sequência no `AppModule` via `APP_GUARD`:

```
ThrottlerGuard → JwtAuthGuard (global) → PlanGuard (global)
```

O `JwtAuthGuard` roda primeiro, seta `request.user`. O `PlanGuard` roda depois com `request.user` já disponível.

---

## Decorators

### `@Public()`
Marca rotas que não exigem autenticação. Lido pelo `JwtAuthGuard` e pelo `PlanGuard`.

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `@SkipPlanGuard()`
Marca endpoints que usuários de institutions SUSPENDED/INACTIVE ainda podem acessar (ex: billing status e portal).

```typescript
// common/decorators/skip-plan-guard.decorator.ts
export const SKIP_PLAN_GUARD_KEY = "skipPlanGuard";
export const SkipPlanGuard = () => SetMetadata(SKIP_PLAN_GUARD_KEY, true);
```

---

## JwtAuthGuard (refatorado)

Passa a ser registrado como `APP_GUARD` e respeita `@Public()`:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) { super(); }

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

---

## JwtStrategy (modificado)

Adiciona `include: { institution: { select: { status: true } } }` à query do `validate()` e retorna `institutionStatus` no user object:

```typescript
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

  if (!user || user.status !== "ACTIVE") throw new UnauthorizedException();

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    institutionId: user.institutionId,
    institutionStatus: user.institution.status,
  };
}
```

---

## PlanGuard

```typescript
// common/guards/plan.guard.ts
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true; // JWT guard tratou o 401

    if (user.role === "ADMIN") return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PLAN_GUARD_KEY, [
      context.getHandler(), context.getClass(),
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

---

## AppModule — registro dos guards globais

```typescript
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: PlanGuard },
  { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
],
```

---

## Remoção de @UseGuards(JwtAuthGuard) nos controllers

Com JWT global, remover `@UseGuards(JwtAuthGuard)` de todos os controllers que o tinham. Controllers que também usam `RolesGuard` mantêm apenas `@UseGuards(RolesGuard)` no método específico.

---

## Adição de @Public()

Controllers/métodos que recebem `@Public()`:
- `AuthController` (classe inteira — login, refresh, forgot-password, reset-password)
- `InstitutionsController` — apenas o método `register()`
- `HealthController` (classe inteira)
- `WebhooksController` (classe inteira — validação via assinatura Stripe)

---

## Adição de @SkipPlanGuard()

- `BillingController.getStatus()` — institutions suspensas precisam ver seu status
- `BillingController.createPortal()` — institutions suspensas precisam acessar o Stripe Portal

---

## Frontend — interceptar 402

Em `apps/web/src/lib/api/client.ts`, no handler de erro HTTP, adicionar tratamento do status 402. O comportamento varia por role (lido do auth store):

- `COORDINATOR` ou `ADMIN` → redireciona para `/coordinator/settings?tab=assinatura`
- `STUDENT` ou `TEACHER` → exibe toast/alert: "A assinatura da sua escola está suspensa. Contate o coordenador."

Para rotas que fazem polling ou múltiplas chamadas, o redirect/toast deve ocorrer apenas uma vez (flag `handled402`).

---

## Testes e2e — plan-guard.e2e-spec.ts

Cenários a cobrir:
1. Institution `TRIAL` → acesso normal (200)
2. Institution `ACTIVE` → acesso normal (200)
3. Institution `SUSPENDED` → rota de negócio retorna 402
4. Institution `SUSPENDED` → `GET /billing/status` retorna 200 (isento)
5. Institution `SUSPENDED` → `POST /billing/portal` retorna 400 (sem customer, mas não 402)
6. Institution `INACTIVE` → rota de negócio retorna 402
7. Usuário `ADMIN` em institution `SUSPENDED` → acesso normal (200)
8. Rota pública (`POST /auth/login`) → 200 independente do status

Estratégia: usar `db.institution.update()` no `beforeEach` para mudar o status da institution de teste, restaurar depois.

---

## Mapa de arquivos

### Criar
- `apps/api/src/common/decorators/public.decorator.ts`
- `apps/api/src/common/decorators/skip-plan-guard.decorator.ts`
- `apps/api/src/common/guards/plan.guard.ts`
- `apps/api/test/plan-guard.e2e-spec.ts`

### Modificar
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/institutions/institutions.controller.ts`
- `apps/api/src/modules/health/health.controller.ts`
- `apps/api/src/modules/billing/webhooks.controller.ts`
- `apps/api/src/modules/billing/billing.controller.ts`
- Todos os controllers com `@UseGuards(JwtAuthGuard)` — remover decorator
- `apps/web/src/lib/api/client.ts`
